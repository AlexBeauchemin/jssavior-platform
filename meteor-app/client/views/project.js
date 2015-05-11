Router.map(function () {
  this.route('project', {
    controller: 'AppController',
    path: '/project/:_id',
    waitOn: function () {
      return [
        Meteor.subscribe('projects')
      ];
    },
    data: function () {
      if(this.ready()) {
        var project = Projects.findOne(this.params._id),
          projects = Projects.find({}, {sort: {name: 1}}).fetch(),
          totalErrors = 0;

        if (!project) {
          if (this.ready()) Router.go('dashboard');
          return;
        }

        _.map(projects, function(project) {
          totalErrors += project.totalErrors;
          project.nbExclusions = Exclusions.find({ project: project._id }).count();
          project.nbDomains = project.domains.length;
          return project;
        });

        var allBrowsers = getBrowsers(project),
          allDomains = getDomains(project);

        Session.set('allBrowsers', allBrowsers);
        Session.set('allDomains', allDomains);

        Session.set('browsers', _.difference(allBrowsers, Session.get('ignoredBrowsers')));
        Session.set('domains', _.difference(allDomains, Session.get('ignoredDomains')));

        if (project.totalErrors <= appConfig.errorsPerPage) {
          Session.set('maxReached', true);
        }

        return {
          currentItemContext: Session.get('currentItemContext'),
          errors: Errors.find({},{sort: Session.get('errorSort')}),
          maxReached: Session.get('maxReached'),
          project: project,
          projects: projects
        };
      }
    },
    onRun: function() {
      var projectId = this.params._id;

      Meteor.call('updateProjectLastAccess', projectId);
      Session.set('errorSort', {date: -1});
      Session.set('maxReached', false);
      Session.set('limit', appConfig.errorsPerPage);
      Session.set('project', projectId);
      Session.set('ignoredBrowsers', []);
      Session.set('ignoredDomains', []);
      Session.set('browsers', []);
      Session.set('domains', []);
      Session.set('currentItemContext', null);

      //TODO: Put this in helper, add a timeout and use the same function in project
      var $window = $(window),
        infiniteTimeout,
        isInfiniteReady = true;

      $window.off('scroll').on('scroll',function () {
        if (!isInfiniteReady) return;
        if ($window.scrollTop() > 0 && $window.scrollTop() == $(document).height() - $window.height()) {
          if (!Session.get('maxReached')) {
            $('#btn-load-more').hide();
            Session.set('limit', Session.get('limit') + appConfig.errorsPerPage);
            if (Session.get('limit') >= Projects.findOne(projectId).totalErrors) {
              Session.set('maxReached', true);
            }
            isInfiniteReady = false;
            infiniteTimeout = setTimeout(function() {
              isInfiniteReady = true;
            },500);
          }
        }
      });

      this.next();
    },
    onBeforeAction: function() {
      this.subscribe('errors', {
        project: this.params._id,
        'browser.name': {$in: Session.get('browsers')},
        domain: {$in: Session.get('domains')},
        sort: Session.get('errorSort'),
        limit: Session.get('limit')
      },function() {
        $('#btn-load-more').show();
      });

      this.next();
    },
    onStop: function() {
      Session.set('limit', appConfig.errorsPerPage);
      Session.set('maxReached', false);
    }
  });
});

Template.project.events({
  'click .error': function (e) {
    $(e.currentTarget).next().toggleClass('open').find('.error-more-info-content').slideToggle('fast');
  },
  'mouseenter .list-group-domains li': function (e) {
    $(e.currentTarget).find('.actions').removeClass('fade');
  },
  'mouseleave .list-group-domains li': function (e) {
    $(e.currentTarget).find('.actions').addClass('fade');
  },
  'click .list-group-domains li label': function (e) {
    var $element = $(e.currentTarget);
    $element.siblings('.actions').removeClass('fade');
    $element.parents('ul').find('.actions.fade').addClass('fade');
  },
  'click [data-action="delete-domain"]': function (e) {
    Meteor.call('deleteDomain', this.name, Session.get('project'));
  },
  'click [data-action="add-domain"]': function (e) {
    Meteor.call('addDomain', $(e.currentTarget).siblings('input').val(), Session.get('project'));
  },
  'keypress input[name="add-domain"]': function (e) {
    if(e.charCode === 13) {
      Meteor.call('addDomain', $(e.currentTarget).val(), Session.get('project'));
    }
  },
  'click [data-action="delete-error"]': function (e) {
    Meteor.call('deleteError', this);
    return false;
  },
  'click [data-action="delete-project"]': function(e) {
    var $btn = $(e.currentTarget);
    $btn.addClass('btn-out');
    $btn.siblings('button').removeClass('btn-out');
  },
  'click [data-action="delete-project-yes"]': function(e) {
    var $btn = $(e.currentTarget);
    $btn.addClass('btn-out');
    $btn.siblings('button').addClass('btn-out');
    Meteor.call('deleteProject', Session.get('project'), function(error,res) {
      if (error) Helpers.outputErrors(error);
      else Router.go('dashboard');
    });
  },
  'click [data-action="delete-project-no"]': function(e) {
    var $btn = $(e.currentTarget);
    $btn.addClass('btn-out').prev().addClass('btn-out').prev().removeClass('btn-out');
  },
  'click [data-action="delete-errors"]': function(e) {
    var $btn = $(e.currentTarget);
    $btn.addClass('btn-out');
    $btn.siblings('button').removeClass('btn-out');
  },
  'click [data-action="delete-errors-yes"]': function(e) {
    var $btn = $(e.currentTarget);
    $btn.addClass('btn-out');
    $btn.siblings('button').addClass('btn-out');
    Meteor.call('emptyErrors', Session.get('project'), function() { });
  },
  'click [data-action="delete-errors-no"]': function(e) {
    var $btn = $(e.currentTarget);
    $btn.addClass('btn-out').prev().addClass('btn-out').prev().removeClass('btn-out');
  },
  'click input[name="browser"]': function(e) {
    var browsers = [];

    $('input[name="browser"]').each(function() {
      var $this = $(this);
      if (!$this.prop('checked')) browsers.push($this.val());
    });

    Session.set('ignoredBrowsers', browsers);
  },
  'click input[name="domain"]': function(e) {
    var domains = [];

    $('input[name="domain"]').each(function() {
      var $this = $(this);
      if (!$this.prop('checked')) domains.push($this.val());
    });

    Session.set('ignoredDomains', domains);
  },
  'click #btn-load-more': function(e) {
    Session.set('limit', Session.get('limit') + appConfig.errorsPerPage);
  },
  'click [data-action="add-file-exclude"]': function (e) {
    Meteor.call('addFileExclude', this.project, this.file, 'exact', function (error) {
      if (error) Helpers.outputErrors(error);
      else Helpers.outputSuccess('Exclusion created');
    });
  },
  'click [data-action="add-message-exclude"]': function (e) {
    Meteor.call('addErrorExclude', this.project, this.message, 'exact', function (error) {
      if (error) Helpers.outputErrors(error);
      else Helpers.outputSuccess('Exclusion created');
    });
  },
  'click [data-action="changeOrder"]': function (e) {
    var orderParamName = $(e.currentTarget).data('order'),
      currentSort = Session.get('errorSort'),
      orderParam = {};

    orderParam[orderParamName] = -1;
    if (currentSort.hasOwnProperty(orderParamName)) orderParam[orderParamName] = currentSort[orderParamName] * -1;
    Session.set('errorSort', orderParam);
  },
  'click [data-action="show-all-context"]': function (e) {
    Session.set('currentItemContext', this.context);

    var $overlay = $('#overlay-context');

    $overlay.removeClass('no-transition');

    Helpers.setOverlay($overlay);
    Helpers.toggleOverlay($overlay);
  },
  'click [data-action="show-stacktrace"]': function (e) {
    $(e.currentTarget).siblings('.stacktrace-more').toggleClass('hidden');
  },
  'click [data-action="create"]': function(e) {
    var $overlay = $('#overlay-create');
    $overlay.removeClass('no-transition');
    Helpers.setOverlay($overlay);
    Helpers.toggleOverlay($overlay);
  }
});

var getDomains = function (project) {
  var domains = [];

  if (!project) return domains;

  _.each(project.totalErrorsByDomain, function (item) {
    domains.push(item.name);
  });

  return domains;
};

var getBrowsers = function (project) {
  var browsers = [];

  if (!project) return browsers;

  _.each(project.totalErrorsByBrowser, function (item) {
    browsers.push(item.name);
  });

  return browsers;
};
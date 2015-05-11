Router.map(function () {
  this.route('dashboard', {
    controller: 'AppController',
    path: '/dashboard',
    waitOn: function () {
      return [
        Meteor.subscribe('projects'),
        Meteor.subscribe('exclusions')
      ];
    },
    data: function () {
      if (this.ready()) {
        Session.setDefault('limit', appConfig.errorsPerPage);

        var projects = Projects.find({}, {sort: {name: 1}}).fetch(),
          errors = Errors.find({}, {sort: {date: -1}, limit: Session.get('limit')}),
          totalErrors = 0;

        //https://www.discovermeteor.com/blog/reactive-joins-in-meteor/
        _.map(projects, function(project) {
          totalErrors += project.totalErrors;
          project.nbExclusions = Exclusions.find({ project: project._id }).count();
          project.nbDomains = project.domains.length;
          return project;
        });

        Session.set('maxReached', totalErrors === errors.count());

        return {
          errors: errors,
          maxReached: Session.get('maxReached'),
          projects: projects
        };
      }
    },
    onBeforeAction: function() {
      this.subscribe('errors', { limit: Session.get('limit')});
      this.next();
    },
    onRun: function () {
      Session.set('limit', appConfig.errorsPerPage);
      Session.set('maxReached', false);

      //TODO: Put this in helper, add a timeout and use the same function in project
      var $window = $(window),
        infiniteTimeout,
        isInfiniteReady = true;

      $window.off('scroll').on('scroll',function () {
        if (!isInfiniteReady) return;
        if ($window.scrollTop() > 0 && $window.scrollTop() == $(document).height() - $window.height()) {
          if (!Session.get('maxReached')) {
            Session.set('limit', Session.get('limit') + appConfig.errorsPerPage);
            isInfiniteReady = false;
            infiniteTimeout = setTimeout(function() {
              isInfiniteReady = true;
            },500);
          }
        }
      });

      this.next();
    },
    onStop: function() {
      Session.set('limit', appConfig.errorsPerPage);
      Session.set('maxReached', false);
    }
  });
});

Template.dashboard.events({
  'click #btn-load-more': function(e) {
    Session.set('limit', Session.get('limit') + appConfig.errorsPerPage);
  },
  'click [data-action="create"]': function(e) {
    var $overlay = $('#overlay-create');
    $overlay.removeClass('no-transition');
    Helpers.setOverlay($overlay);
    Helpers.toggleOverlay($overlay);
  }
});


Router.map(function () {
  this.route('project-exclude', {
    controller: 'AppController',
    path: '/exclude/:_id',
    waitOn: function () {
      return [
        Meteor.subscribe('projects', this.params._id),
        Meteor.subscribe('exclusions', { project: this.params._id })
      ];
    },
    data: function () {
      if(this.ready()) {
        var project = Projects.findOne(this.params._id);
        if (!project) {
          if (this.ready()) Router.go('dashboard');
          return;
        }

        var exclusions = Exclusions.find({ project: project._id }, { sort: {date: -1}}).fetch();

        return {
          project: project,
          projects: Projects.find(),
          exclusions: exclusions
        };
      }
    },
    action: function () {
      if(this.ready()) {
        this.render('project-exclude');
      }
    }
  });
});

Template['project-exclude'].events({
  'click [data-action="add-error-exclude"]': function (e) {
    var $el = $(e.currentTarget),
      $value = $el.siblings('input[type="text"]'),
      sensivity = $el.parents().find('input[name="error-sensivity"]').val();

    Meteor.call('addErrorExclude', this.project._id, $value.val(), sensivity, function (error) {
      if (error) Helpers.outputErrors(error);
      else $value.val('');
    });
  },
  'click [data-action="add-file-exclude"]': function (e) {
    var $el = $(e.currentTarget),
      $value = $el.siblings('input[type="text"]'),
      sensivity = $el.parents().find('input[name="filename-sensivity"]').val();

    Meteor.call('addFileExclude', this.project._id, $value.val(), sensivity, function (error) {
      if (error) Helpers.outputErrors(error);
      else $value.val('');
    });
  },
  'click [data-action="delete-exclusion"]': function (e) {
    var $el = $(e.currentTarget);

    Meteor.call('deleteExclusion', this.project, $el.data('id'), function (error) {
      if (error) Helpers.outputErrors(error);
    });
  }
});


Router.map(function () {
  this.route('projects', {
    path: '/projects',
    waitOn: function () {
      return [
        Meteor.subscribe('projects'),
        Meteor.subscribe('errors'),
        Meteor.subscribe('exclusions')
      ];
    },
    data: function () {
      var projects = Projects.find({}, {sort: {name: 1}}).fetch();

      _.map(projects, function(project) {
        project.nbErrors = Errors.find({project: project._id}).count();
        project.nbExclusions = Exclusions.find({ project: project._id }).count();
        project.nbDomains = project.domains.length;
        return project;
      });

      return {
        projects: projects
      };
    },
    action: function () {
      if(this.ready()) {
        this.render();
      }
    }
  });
});

Template.projects.events({
  'click [data-action="create"]': function(e) {
    var $overlay = $('#overlay-create');
    $overlay.removeClass('no-transition');
    Helpers.setOverlay($overlay);
    Helpers.toggleOverlay($overlay);
  }
});


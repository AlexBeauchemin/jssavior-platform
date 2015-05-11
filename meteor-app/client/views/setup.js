Router.map(function () {
  this.route('setup', {
    path: '/setup',
    waitOn: function () {
      return [
        Meteor.subscribe('projects')
      ];
    },
    data: function () {
      return {
        projects: Projects.find({}, {sort: {name: 1}})
      };
    }
  });
});


Router.map(function() {
  this.route('settings', {
    controller: 'AppController',
    path: '/settings',
    waitOn: function () {
      return [
        Meteor.subscribe('projects', this.params._id)
      ];
    },
    data: function () {
      return {
        projects: Projects.find()
      };
    }
  });
});

Template.settings.events({
  'click [data-action="change-password"]': function (e) {
    e.preventDefault();

    var password = $('input[name="password"]').val(),
      passwordConfirm = $('input[name="password-confirm"]').val();

    if (password != passwordConfirm) return Helpers.outputErrors('The password confirmation is not the same.');

    Meteor.call('setPassword', password, function(error,result) {
      if(error) {
        Helpers.outputErrors(error);
        return;
      }
      Helpers.outputSuccess(result);
      Router.go('dashboard');
    });
  }
});
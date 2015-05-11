Router.map(function() {
  this.route('reset-password', {
    path: '/reset-password/:token',
    onBeforeAction: function(){
      var token = this.params.token;
      if (!token) Router.go('dashboard');
      Meteor.call('verifyToken', token, function(error) {
        if (error) Router.go('dashboard');

        Session.set('reset_token', token);
      });

      this.next();
    },
    action: function () {
      this.render('reset-password');
    }
  });
});

Template['reset-password'].events({
  'click [data-action="change-password"]': function (e) {
    e.preventDefault();


    var $form = $(e.currentTarget).parents('form'),
      password = $form.find('input[name="password"]').val(),
      confirm = $form.find('input[name="password-confirm"]').val();

    if (password != confirm) {
      Helpers.outputErrors('The password confirmation is not the same.');
      return;
    }

    Meteor.call('resetChangePassword', Session.get('reset_token'), password, function (error) {
      if (error) {
        Helpers.outputErrors(error);
        return;
      }

      Helpers.outputSuccess('Your password has been changed.');
      Router.go('home');
    });

    return false;
  }
});
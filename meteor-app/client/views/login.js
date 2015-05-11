Template.login.helpers({
  isServicesConfigured: function () {
    return Accounts.loginServicesConfigured();
  }
});

Template.login.events({
  'click [data-action="switch-create"]': function (e, _this) {
    e.preventDefault();
    switchLoginState(_this.$sections, 'create');
  },
  'click [data-action="switch-login"]': function (e, _this) {
    e.preventDefault();
    switchLoginState(_this.$sections, 'login');
  },
  'click [data-action="switch-forgot"]': function (e, _this) {
    e.preventDefault();
    switchLoginState(_this.$sections, 'forgot');
  },
  'click [data-action="reset"]': function (e) {
    e.preventDefault();

    var email = $(e.currentTarget).siblings('input').val();

    Meteor.call('sendResetPasswordEmail', email, function(error) {
      if (error) Helpers.outputErrors(error);
      else {
        Helpers.outputSuccess('An email has been sent to your email address.');
        Helpers.toggleOverlay(Helpers.$overlayLogin);
      }
    });
  },
  'click [data-action="login"]': function (e) {
    e.preventDefault();

    var email = $(e.currentTarget).siblings('input[name="email"]').val(),
      password = $(e.currentTarget).siblings('input[name="password"]').val();

    Meteor.loginWithPassword({email: email}, password, function (error) {
      if (error) Helpers.outputErrors(error);
      else {
        Helpers.outputSuccess('You are now logged in.');
        Helpers.toggleOverlay(Helpers.$overlayLogin);
      }
    });
  },
  'click [data-action="create"]': function (e) {
    e.preventDefault();

    var email = $(e.currentTarget).siblings('input[name="email"]').val(),
      password = $(e.currentTarget).siblings('input[name="password"]').val();

    Helpers.createAccount(email, password);
  },
  'click [data-action="login-github"]': function (e) {
    e.preventDefault();

    Meteor.loginWithGithub({}, function (err) {
      if (err) Helpers.outputErrors(err);
      else Helpers.toggleOverlay(Helpers.$overlayLogin);
    });
  },
  'click [data-action="login-google"]': function (e) {
    e.preventDefault();

    Meteor.loginWithGoogle({}, function (err) {
      if (err) Helpers.outputErrors(err);
      else Helpers.toggleOverlay(Helpers.$overlayLogin);
    });
  }
});

Template.login.rendered = function() {
  this.$sections = $(this.findAll('.form-group'));
};

var switchLoginState = function ($sections, stateClass) {
  $sections.each(function() {
    var $el = $(this);
    if($el.hasClass(stateClass)) $el.removeClass('hidden');
    else $el.addClass('hidden');
  });
};
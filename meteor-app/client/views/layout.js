Template.layout.events({
  'click .dropdown-menu a': function (e) {
    e.preventDefault();
    var $el = $(e.currentTarget);

    if ($el.parent().hasClass('more-projects')) Router.go($el.attr('href'));
    else Router.go($el.attr('href'));
  },
  'click .burger': function(e) {
    e.preventDefault();

    $('.navbar-collapse').toggleClass('collapse');
    $(e.currentTarget).parents('.container').toggleClass('open');
  },
  'click nav a': function(e) {
    //Close menu on mobile
    if (!$(e.currentTarget).hasClass('dropdown-toggle')) {
      $('.container').removeClass('open');
      $('.navbar-collapse').addClass('collapse');
    }
  },
  'click [data-action="login"]': function(e) {
    var $overlay = $('#overlay-login');
    $overlay.removeClass('no-transition');
    Helpers.toggleOverlay($overlay);
  },
  'click [data-action="logout"]': function(e) {
    Meteor.logout(function (error) {
      if (error) Helpers.outputErrors(error);
    });
  },
  'click .navbar-nav>li>a': function(e) {
    $('#navbar').collapse('hide');
  }
});

Template.layout.rendered = function() {
  Helpers.init();
};

Template.layout.helpers({
  topProjects: function() {
    return Projects.find({}, {sort: {dateLastAccess: -1}, limit: 10});
  }
});

Template.layout.isShowMoreProjects = function() {
  if (Projects.find({}).count() < 10) return 'hidden';
  return '';
};
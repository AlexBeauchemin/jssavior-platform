Template['project-create'].events({
  'click [data-action="create-project"]': function (e) {
    e.preventDefault();

    var $input = $(e.currentTarget).closest('form').find('input[name="name"]');
    var val = $input.val();

    if (!val) {
      $input.focus();
      Helpers.outputErrors("Project name can't be empty");
      return;
    }

    Meteor.call('addProject', val, function(error,result) {
      if (error) Helpers.outputErrors(error);
      else {
        Helpers.toggleOverlay();
        setTimeout(function() {
          Router.go('/project/' + result);
        },500);
      }
    });

    return false;
  }
});

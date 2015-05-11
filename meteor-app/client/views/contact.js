Router.map(function () {
  this.route('contact', {
    path: '/contact',
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


Template.contact.events({
  'click [data-action="send-email"]': function (e) {
    var $form = $(e.target).parents('form'),
      $title = $form.find('#title'),
      $text = $form.find('#message');

    $title.parent().removeClass('has-error');
    $text.parent().removeClass('has-error');
    if (!$title.val()) $title.parent().addClass('has-error');
    if (!$text.val()) $text.parent().addClass('has-error');

    Meteor.call('sendEmail',
      $form.find('#name').val(),
      $form.find('#email').val(),
      $title.val(),
      $text.val(),
      function(error,result) {
        if(error) {
          Helpers.outputErrors(error);
        }
        else {
          $('.container-contact form').addClass('hidden');
          $('.message-sent').removeClass('hidden');
        }
      });

    return false;
  }
});

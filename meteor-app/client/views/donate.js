Router.map(function () {
  this.route('donate', {
    path: '/donate',
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


Template.donate.events({
  'click [data-action="stripe"]': function(e) {
    e.preventDefault();

    var amount = $(e.currentTarget).data('amount');

    if (amount === "custom") {
      amount = $('input[name="amount"]').val();
    }

    amount = parseInt(amount,10) * 100;
    if (!amount) return;

    StripeCheckout.open({
      key: appConfig.stripe[appConfig.env].publicKey,
      amount: amount,
      name: 'JSSavior',
      description: 'Buy a beer',
      panelLabel: 'Pay Now',
      image: '/img/jssavior-square.png',
      token: function(res) {
        var stripeToken = res.id;
        Meteor.call('chargeCard', stripeToken, amount, function (error, res) {
          if (error) Helpers.outputErrors("Sorry, your donation didn't work :(");
          if (!error && res) Helpers.outputSuccess("Thank you for your " + amount / 100 + "$ donation!");
        });
      }
    });
  }
});

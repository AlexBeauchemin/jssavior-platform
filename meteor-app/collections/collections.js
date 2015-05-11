//TODO: Use check to validate data type, ex: check(id, String);

Projects = new Meteor.Collection("projects");
Errors = new Meteor.Collection("errors");
Exclusions = new Meteor.Collection("exclusions");

if(Meteor.isClient) {
  //Stub methods for faster auto-corrected results
  Meteor.methods({
    //...
  });
}

if(Meteor.isServer) {
  //Private methods, only available server side
  addError = function(data) {
    Errors.insert(data);

    var project = Projects.findOne(data.project),
      totalErrors = project.totalErrors || 0,
      totalErrorsByBrowser = [],
      totalErrorsByDomain = [],
      found = false;

    if(!project.totalErrorsByBrowser)  totalErrorsByBrowser = [{ name: data.browser.name, total: 0}];
    else totalErrorsByBrowser = project.totalErrorsByBrowser;

    if(!project.totalErrorsByDomain)  totalErrorsByDomain = [{ name: data.domain, total: 0}];
    else totalErrorsByDomain = project.totalErrorsByDomain;

    _.each(totalErrorsByBrowser, function(item) {
      if (item.name == data.browser.name) {
        item.total += 1;
        found = true;
      }
    });

    if (!found) totalErrorsByBrowser.push({ name: data.browser.name, total: 1});

    _.each(totalErrorsByDomain, function(item) {
      if (item.name == data.domain) {
        item.total += 1;
        found = true;
      }
    });

    if (!found) totalErrorsByDomain.push({ name: data.domain, total: 1});

    Projects.update(data.project, { $set: {
      totalErrors: totalErrors + 1,
      totalErrorsByBrowser: totalErrorsByBrowser,
      totalErrorsByDomain: totalErrorsByDomain
    }});
  };

  Meteor.methods({
    deleteError: function(data) {
      if(!isOwner(data.project)) return;
      Errors.remove(data._id);

      var project = Projects.findOne(data.project),
        totalErrors = project.totalErrors || 1,
        errorsByDomain = project.totalErrorsByDomain,
        errorsByBrowser = project.totalErrorsByBrowser;

      _.each(errorsByDomain, function(e, index) {
        if (e.name == data.domain) errorsByDomain[index].total -=1;
      });

      _.each(errorsByBrowser, function(e, index) {
        if (e.name == data.browser.name) errorsByBrowser[index].total -=1;
        if (!errorsByBrowser[index].total) errorsByBrowser.splice(index, 1);
      });

      Projects.update(data.project, { $set: {
        totalErrors: totalErrors - 1,
        totalErrorsByDomain: errorsByDomain,
        totalErrorsByBrowser: errorsByBrowser
      }});
    },

    emptyErrors: function(project) {
      if(!isOwner(project)) return;
      Errors.remove({ project: project });
      Projects.update(project, { $set: {
        totalErrors: 0,
        totalErrorsByDomain: [],
        totalErrorsByBrowser: []
      }});
    },

    deleteDomain: function(domain, project) {
      if(!isOwner(project)) return;
      var errorsByDomain = Projects.findOne(project).totalErrorsByDomain;

      Projects.update(project, {$pull: { domains: domain}});

      var nbErrors = Errors.find({project: project, domain: domain}).count();
      Errors.remove({project: project, domain: domain});

      _.each(errorsByDomain, function(e, index) {
        if (e.name == domain) errorsByDomain.splice(index, 1);
      });

      var totalErrors = Projects.findOne(project).totalErrors || 0;
      Projects.update(project, { $set: { totalErrors: totalErrors - nbErrors, totalErrorsByDomain: errorsByDomain}});
    },

    addDomain: function(domain, project) {
      if(!isOwner(project)) return;
      domain = domain.trim().replace('www.','')
                .replace('https://','')
                .replace('http://','');

      Projects.update(project, {$addToSet: { domains: domain, totalErrorsByDomain: {name: domain, total: 0}}});
    },

    addProject: function(name) {
      if(!Meteor.user()) return;
      return Projects.insert({
        name: name,
        domains: [],
        users: [appConfig.admin.id, Meteor.user()._id],
        dateCreated: Date.now(),
        dateLastAccess: Date.now(),
        totalErrors: 0,
        totalErrorsByBrowser: [],
        totalErrorsByDomain: []
      });
    },

    updateProjectLastAccess: function(project) {
      if(!isOwner(project)) return;
      Projects.update(project, { $set: { dateLastAccess: Date.now()}});
    },

    deleteProject: function(project) {
      if(!isOwner(project)) return;
      Projects.remove(project);
      Errors.remove({ project: project });
    },

    sendEmail: function (name, from, subject, text) {
      check([name, from, subject, text], [String]);

      if(!subject || !text) {
        throw new Meteor.Error("Please fill required (*) fields");
      }

      // Let other method calls from the same client start running,
      // without waiting for the email sending to complete.
      this.unblock();

      var options = {
        apiKey: appConfig.mailgun.apiKey,
        domain: 'jssavior.com'
      };

      var data = {
        to: 'alexbeauchemin01@gmail.com',
        from: from || 'postman@jssavior.com',
        subject: 'JSSavior: ' + subject,
        text: text + '\n\n' + '- ' + name
      };

      var email = new Mailgun(options);
      email.send(data);
    },

    sendResetPasswordEmail: function(email) {
      var user = Meteor.users.findOne({ 'emails.address': email });
      if (!user) throw new Meteor.Error('Email address not found');

      this.unblock();

      Accounts.sendResetPasswordEmail(user._id);
    },

    verifyToken: function(token) {
      var user = Meteor.users.findOne({ 'services.password.reset.token': token });
      if (!user || !token) throw new Meteor.Error('No user');

      return true;
    },

    setPassword: function(password) {
      if(!password || password.length < 5) throw new Meteor.Error('The password must be at least 5 characters.');
      Accounts.setPassword(Meteor.user()._id, password);
      return 'Your password has been changed.';
    },

    resetChangePassword: function(token, password) {
      var user = Meteor.users.findOne({ 'services.password.reset.token': token });
      if (!user || !token) throw new Meteor.Error('Token invalid');

      if(!password || password.length < 5) throw new Meteor.Error('The password must be at least 5 characters.');
      Accounts.setPassword(user._id, password);
      return 'Your password has been changed.';
    },

    getEnvironment: function() {
      if (process.env.ROOT_URL.indexOf('localhost') > -1) return 'dev';
      return 'prod';
    },

    addFileExclude: function(project, value, sensivity) {
      if (!isOwner(project)) throw new Meteor.Error('You do not have the rights to do this.');
      if (!value) throw new Meteor.Error('Can\'t exclude an empty file name.');

      Exclusions.insert({
        project: project,
        sensivity: sensivity,
        value: value,
        type: 'file'
      });
    },

    addErrorExclude: function(project, value, sensivity) {
      if (!isOwner(project)) throw new Meteor.Error('You do not have the rights to do this.');
      if (!value) throw new Meteor.Error('Can\'t exclude an empty error message.');

      Exclusions.insert({
        project: project,
        sensivity: sensivity,
        value: value,
        type: 'error'
      });
    },

    deleteExclusion: function(project, id) {
      if(!isOwner(project)) throw new Meteor.Error('You do not have the rights to do this.');
      Exclusions.remove(id);
    },

    'chargeCard': function(stripeToken, amount) {
      var env = Meteor.call('getEnvironment'),
          Stripe = StripeAPI(appConfig.stripe[env].secretKey);

      //Taken from http://stackoverflow.com/questions/26226583/meteor-proper-use-of-meteor-wrapasync-on-server
      //TODO: Find a way to return the error, the catch->throw doesn't seems to work

      try {
        var charge = Meteor.wrapAsync(Stripe.charges.create, Stripe.charges);
        var result = charge({
          amount: amount,
          currency: 'usd',
          source: stripeToken
        });

        return true;
      }
      catch(error){
        throw new Meteor.Error(error.message);
      }
    }
  });

  var isOwner = function(projectId) {
    var project = Projects.findOne({_id: projectId, users: Meteor.user()._id});
    if(!project) return false;
    return true;
  };
}
Meteor.startup(function() {
  var env = Meteor.call('getEnvironment');

  if(!Meteor.users.findOne({})) {
    appConfig.admin.id = Accounts.createUser({email: appConfig.admin.email, password: appConfig.admin.password});
    return;
  }

  appConfig.admin.id = Meteor.users.findOne({ emails: { $elemMatch: { address: appConfig.admin.email } } })._id;

  if (!Errors.findOne()) {
    Errors._ensureIndex({_id: 1, project: 1, date: 1, domain: 1, file: 1, message:1, browser:1});

    //StubData();
  }

  //if (appConfig.gunmailPassword) {
  //  process.env.MAIL_URL = 'smtp://postmaster%40jssavior.com:' + appConfig.gunmailPassword + '@smtp.mailgun.org:587';
  //}

  if (appConfig.serviceConfiguration.github) {
    ServiceConfiguration.configurations.remove({
      service: "github"
    });
    ServiceConfiguration.configurations.insert({
      service: "github",
      clientId: appConfig.serviceConfiguration.github[env].clientId,
      secret: appConfig.serviceConfiguration.github[env].secret
    });
  }

  if (appConfig.serviceConfiguration.google) {
    ServiceConfiguration.configurations.remove({
      service: "google"
    });
    ServiceConfiguration.configurations.insert({
      service: "google",
      clientId: appConfig.serviceConfiguration.google[env].clientId,
      secret: appConfig.serviceConfiguration.google[env].secret
    });
  }
});

//Validations for account creation (part of the account package)
Accounts.validateNewUser(function (user) {
  var email = user.emails[0].address;
  var re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  if (email.length < 3 || !re.test(email)) throw new Meteor.Error(403, "Email address is invalid");
  return true;
});

Accounts.onCreateUser(function (options, user) {
  if (user.services) {
    var service = _.keys(user.services)[0]; //github or google

    //If normal account creation return immediatly
    if (service != 'github' && service != 'google') return user;

    var accessToken = user.services[service].accessToken,
      result = {};

    if (service == 'github') {
      result = Meteor.http.get("https://api.github.com/user", {
        headers: {"User-Agent": "Meteor/1.0"},
        params: {
          access_token: accessToken
        }
      });

      if (result.error) throw result.error;
    }
    else if (service == 'google') {
      result.data = user.services[service];
      result.data.avatar_url = result.data.picture;
    }

    if (result && result.data) {
      var existingUser = Meteor.users.findOne({'emails.address': result.data.email});

      if (!existingUser) {
        user.emails = [
          {
            address: result.data.email,
            verifier: false
          }
        ];

        user.profile = _.pick(result.data,
          'name',
          'avatar_url'
        );

        return user;
      }

      existingUser.profile = _.pick(result.data,
        'name',
        'avatar_url'
      );

      Meteor.users.remove({_id: existingUser._id});
      return existingUser;
    }

  }

  return user;
});

Accounts.emailTemplates.resetPassword.html = function(user, url) {
  var name = user.emails[0].address;
  if (user.profile && user.profile.name) name = user.profile.name;

  url = url.replace('#/', '');

  return 'Hello ' + name + ',\r\n\r\n' +
    'To reset your password, simply click <a href="' + url + '">here</a>.';
};

var StubData = function() {
  var projectId = Projects.insert({ name: 'test-default', domains: ['localhost'], users: [appConfig.admin.id], dateCreated: Date.now(), dateLastAccess: Date.now()});

  var error = {
    "browser": { "name" : "Chrome", "chrome" : true, "version" : "35.0", "webkit" : true, "a" : true },
    "clientInfo" : {},
    "column" : 22,
    "count" : 7,
    "date" : Date.now(),
    "domain" : "localhost",
    "file" : "http://localhost:22292/js/test.js",
    "line" : 7,
    "message" : "Uncaught ReferenceError: Class is not defined",
    "project" : projectId,
    "projectName" : "test-default",
    "stack" : {
      "message" : "Class is not defined",
      "stack" : "ReferenceError: Class is not defined"
    },
    "userAgent" : "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.114 Safari/537.36",
    "url" : "http://localhost:22292/en",
    "version" : 0.1
  };

  for (var x = 0; x < 750; x++) {
    addError(error);
  }

  error.browser = { "name" : "Firefox", "firefox" : true, "version" : "30.0", "gecko" : true, "a" : true };
  error.domain = 'test.com';

  for (x = 0; x < 750; x++) {
    addError(error);
  }
};
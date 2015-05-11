//TODO: UserId var in object sent to jssavior (generated by the site, not jssavior) ... limit number or errors logged if active (time or number)
//TODO: Better way to handle admin (not add his id to all projects) access level ?
//TODO: Add protection against entries (limit maximum characters)
//TODO: Add search by context
//TODO: Settings -> Choose fields to show in table
//TODO: Activate stripe account
//TODO: Switch from less to postcss

Meteor.call('getEnvironment', function(err, res) {
  appConfig.env = res;
});

Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading'
});

Router.onBeforeAction('loading');

AppController = RouteController.extend({
  onBeforeAction: function(){
    if(_.isNull(Meteor.user())){
      Router.go('home');
    }

    this.next();
  }
});

UI.registerHelper("dateFormatFromNow", function(timestamp) {
  return moment(new Date(timestamp)).fromNow();
});

UI.registerHelper("isCurrentProject", function(id) {
  if (id === Session.get('project')) return 'active';
  return '';
});

UI.registerHelper('isCheckboxInSession',function(session,data){
  var sessionValue = Session.get(session);
  if (sessionValue == data) return 'checked';
  if (toString.call(sessionValue) == "[object Array]" && sessionValue.indexOf(data) > -1) return 'checked';
  return '';
});

UI.registerHelper("dateFormat", function(timestamp) {
  return moment(new Date(timestamp)).format('MMMM Do YYYY, h:mm:ss a');
});

UI.registerHelper('isCurrentRoute', function (routeName) {
  var currentRoute = Router.current();
  if (!currentRoute || routeName != currentRoute.route.getName()) return '';
  return 'active';
});

UI.registerHelper('formatStacktrace', function (text) {
  if (!text) return text;
  text = text.split('at ');

  if (text.length > 1) {
    text[0] += '<a href="#" data-action="show-stacktrace">... Show more</a><span class="stacktrace-more hidden">';
    text = text.join('<br>at ') + '</span>';
  }
  else {
    text = text[0];
  }

  return new Spacebars.SafeString(text);
});

UI.registerHelper('getFirstContext', function (context) {
  if (!context || !context[0] || !context[0].value) return false;
  return context[0].value;
});

UI.registerHelper('removeDomain', function (file) {
  return file.parseUri().path || file;
});


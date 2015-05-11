Router.map(function () {
  this.route('home', {
    path: '/',
    data: function () {
      if (this.ready()) {
        if (!Session.get('demoData')) {
          var demoData = [];
          for (var i = 0; i < 10; i++)
            demoData.push(createDemoError());
          Session.set('demoData', demoData);
        }

        return {
          demoData: Session.get('demoData'),
          projects: Projects.find()
        };
      }
    },
    onRun: function () {
      Meteor.setInterval(addDemoData, 3000);
      this.next();
    }
  });
});

var createDemoError = function() {
  var messages = [
    'Uncaught TypeError: undefined is not a function',
    'Uncaught ReferenceError: $ is not defined',
    'SyntaxError: Unexpected token ":"'
  ];

  var files = [
      'dest/test.js',
      'dest/anotherFile.js',
      'libs/customLib.min.js'
  ];

  var browsers = [
      'Chrome 36',
      'Internet Explorer 9',
      'Internet Explorer 10',
      'Firefox 31'
  ];

  var domains = ['localhost', 'mywebsite.com', 'test.mywebsite.com'];

  return {
    count: getRandomInt(1,20),
    browser: browsers[getRandomInt(0,3)],
    message: messages[getRandomInt(0,2)],
    file: files[getRandomInt(0,2)],
    line: getRandomInt(1,1500),
    date: Date.now(),
    domain: domains[getRandomInt(0,2)]
  };
};

var getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var addDemoData = function() {
  var demoData = Session.get('demoData');

  if (demoData) {
    demoData.splice(-1,1);
    demoData.unshift(createDemoError());
    Session.set('demoData', demoData);
  }
};


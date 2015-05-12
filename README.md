JSSavior platform
=================

A Javascript Error Logging Platform

The repository for the jssavior.js file is [here](https://github.com/AlexBeauchemin/jssavior)

How to install (with meteor)
================

Install Nodejs and Meteor

Create a folder named jssavior for example

In the folder, use the command : meteor create meteor-app

Remove javascript/css/html files in the meteor-app folder

Extract the content of this github in the jssavior folder

-- These command may not be required
- meteor remove autopublish
- meteor remove insecure
- meteor add service-configuration
- meteor add iron:router
- meteor add accounts-github
- meteor add accounts-google
- meteor add mrt:bootstrap-3


Go back to the root of the project and use the following commands
npm install

Open meteor-app/lib/config/config.js.template, rename it config.js and fill the information.

Finally, every time you run the project, open two terminals and run these commands
- meteor
- grunt


JSSavior should be accessible at http://localhost:3000

How to use
================

[Complete doc available on jssavior.com/setup](http://www.jssavior.com/setup)

1) Create an account and log in on [jssavior.com](http://www.jssavior.com)

2) Create a project

3) Add the javascript file jssavior.min.js in your project (this file should be the first javascript file to load in your project, ideally the first script to be loaded in the header) 
```
<script src="//cdn.jsdelivr.net/jssavior/latest/jssavior.min.js"></script>
```

If you want to load jssavior asynchronously and catch errors happening before the file is loaded, add this code at the beginning of the body of the site :
```
window.onerror = function(message,file,line, column, errorObj) {
  JSSaviorConfig.errorQueue.push({
    column: column,
    errorObj: errorObj,
    file: file,
    line: line,
    message: message
  });
};
```

4) Add the ID of your project right above the code from step 3 
```
<script> 
  var JSSaviorConfig = { 
    projectId: 'xxxxxxxxx',
    errorQueue: []
  }; 
</script>
```

5) Go to your project and add the domain that you will log your errors from. If there is a javascript error in your project and the domain is not listed in the project's domains list, the error will not be logged.

6) That's it! JSSavior is now ready to log your bad coding! :)

[More info/options on how to use JSSavior here](http://www.jssavior.com/setup)

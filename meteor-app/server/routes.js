var fs = Npm.require('fs');

Router.map(function () {
  this.route('writeError', {
    where: 'server',
    path: '/api/send',
    action: function() {
      var requestMethod = this.request.method, // GET, POST, PUT, DELETE
        requestData = this.request.body, // Data from a POST request
        origin = this.request.headers.origin,
        referer = this.request.headers.referer;

      if (!origin) origin = referer;

      this.response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-type',
        'Content-Type': 'application/json'
      });

      requestData = isDataValid(requestData, origin);

      if (requestData.error) {
        this.response.end(JSON.stringify({ status: 'error', reason: requestData.error }));
        return;
      }

      //TODO: clientInfo always empty, fix it or remove
      var data = {
        browser: Bowser.detect(requestData.userAgent),
        clientInfo: requestData.clientInfo,
        column: requestData.column,
        context: [],
        count: 1,
        date: Date.now(),
        domain: requestData.domain,
        file: requestData.file,
        line: requestData.line,
        message: requestData.message,
        project: requestData.project,
        projectName: requestData.projectName,
        stack: requestData.stack,
        userAgent: requestData.userAgent,
        url: requestData.url,
        version: requestData.version
      };

      var context;
      if (requestData.context) {
        context = {
          value: requestData.context,
          browser: data.browser,
          date: Date.now()
        };
      }

      //Put version in browser name for IE to split every IE as a different browser
      if (data.browser.name == 'Internet Explorer') {
        data.browser.name = data.browser.name + ' ' + data.browser.version;
        data.browser.version = '';
      }

      var error = Errors.findOne({ project: data.project , message: data.message, file: data.file, line: data.line, domain: data.domain, 'browser.name': data.browser.name, 'browser.version': data.browser.version });

      if (error) {
        data.count = error.count + 1;
        data.context = error.context;

        if (context && error.context && error.context.length) {
          error.context.unshift(context);
          if (error.context.length >= 100) data.context = error.context.splice(0,100);
        }
        else if (context) data.context = [context];

        Errors.update(error._id, data);
      }
      else {
        if (context) data.context = [context];
        addError(data);
      }

      //TODO: Put the response in the insert callback ?
      this.response.end(JSON.stringify({ status: 'success' }));
    }
  });

  //Not needed anymore, using jsDelivr instead
  this.route('cdn', {
    where: 'server',
    path: '/cdn/*',
    action: function () {
//      var file = fs.readFileSync('./client/app/js/jssavior.min.js'),
//        headers = {
//        'Access-Control-Allow-Origin': '*',
//        'Content-type': 'application/javascript'
//      };

      this.response.writeHead(301, {'Location': '//cdn.jsdelivr.net/jssavior/latest/jssavior.min.js'});
      return this.response.end();
    }
  });
});

function isDataValid(data, origin) {
  if (!data) {
    return { error: 'No data has been sent' };
  }

  var project = Projects.findOne(data.project);
  if (!project) {
    return { error: 'This project doesn\'t exist (' + data.project + ')' };
  }

  data.projectName = project.name;

  var isDomainValid = false,
    originUrl = '';

  if (origin) originUrl = origin.parseUri().host.replace('www.', '');

  project.domains.forEach(function(domain){
    if (originUrl === domain) isDomainValid = true;

    //Verify wildcards like *.mydomain.com
    else if (domain.substr(0,2) === '*.') {
      var wildCardDomain = domain.substr(2);
      if (originUrl.substr(originUrl.length - wildCardDomain.length) == wildCardDomain) isDomainValid = true;
    }
    else if (domain === '*') {
      if (data.domain === '') data.domain = 'no-domain';
      isDomainValid = true;
    }
  });

  if (!isDomainValid) {
    return { error: 'The domain providing the request (' + origin.parseUri().host + ') is not associated with the project.' };
  }

  if (data.key != project.key) {
    return { error: 'This project key is invalid' };
  }

  var skipData = Exclusions.find({ project: project._id }).fetch(),
    excluded = isExcluded(skipData,data);

  if (excluded) return { error: 'JSSavior exclusion' };

  return data;
}

function isExcluded(skipData,data) {
  _.each(skipData, function(el) {
    if (el.type == "file") {
      if (el.sensivity == 'exact') {
        if (data.file == el.value) {
          return true;
        }
      }
      else if (data.file.indexOf(el.value) > -1) {
        return true;
      }
    }
    else {
      if (el.sensivity == 'exact') {
        if (data.message == el.value || (data.stack && data.stack.message && data.stack.message == el.value)) {
          return true;
        }
      }
      else if (data.message.indexOf(el.value) > -1 || (data.stack && data.stack.message && data.stack.message.indexOf(el.value) > -1)) {
        return true;
      }
    }

    return false;
  });
}
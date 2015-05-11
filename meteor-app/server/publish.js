Meteor.publish("projects", function (data) {
  if(!data) { return Projects.find({users: this.userId }, {field: {users: 0}}); }

  if (typeof data === 'string') { data = { _id: data }; }
  data.users = this.userId;
  return Projects.find(data, {field: {users: 0}});
});

Meteor.publish("errors", function (data) {
  if (!this.userId) return [];

  var qryProjects = Projects.find({users: this.userId}, {fields: {_id: 1}}).fetch(),
    projects = [];

  _.each(qryProjects, function(project) {
    projects.push(project._id);
  });

  var limit = appConfig.errorsPerPage,
    sort = {date: -1};

  if (data) {
    if (data.page)  {
      limit = appConfig.errorsPerPage * data.page;
      delete data.page;
    }

    if (data.limit) {
      limit = data.limit;
      delete data.limit;
    }

    if (data.sort) {
      sort = data.sort;
      delete data.sort;
    }

    if (!data.project) data.project = { $in: projects };
  }
  else {
    data = { project: { $in: projects }};
  }

  return Errors.find(data, {sort: sort, limit: limit});
});

Meteor.publish("exclusions", function(data) {
  var qryProjects = Projects.find({users: this.userId}, {fields: {_id: 1}}).fetch(),
    projects = [];

  _.each(qryProjects, function(project) {
    projects.push(project._id);
  });

  if (data) {
    if (!data.project) data.project = { $in: projects };
  }
  else {
    data = { project: { $in: projects }};
  }

  return Exclusions.find(data, {sort: {date: -1}});
});
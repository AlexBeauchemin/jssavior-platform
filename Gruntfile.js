module.exports = function(grunt) {
  var config = {
    clientSrc: 'meteor-app/client',
    cssSrc: 'meteor-app/client/css',
    public: 'meteor-app/public'
  };

  require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    config: config,
    pkg: grunt.file.readJSON('package.json'),
    banner: '/* <%= pkg.name %> - <%= pkg.version %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy-mm-dd") %> <%= pkg.author.name %> - <%= pkg.author.url %> */\n\n',
    autoprefixer: {
      dist: {
        options: {
          browsers: ['last 2 version', '> 1%', 'ie 8', 'ie 9', 'Firefox ESR']
        },
        files: {
          '<%= config.public %>/main.css': ['<%= config.public %>/main.css']
        }
      }
    },
    cssmin: {
      options: {
        banner: '<%= banner %>'
      },
      files: {
        src: '<%= config.public %>/main.css',
        dest: '<%= config.public %>/main.css'
      }
    },
    jshint: {
      files: ['<%= config.clientSrc %>/views/*.js', 'meteor-app/collections/*.js', 'meteor-app/server/*.js'],
      options: {
        force: true
      }
    },
    less: {
      options: {
        cleancss: false
//TODO: Allow less mapping (is tricky because of meteor files behavior
//        sourceMap: true,
//        sourceMapURL: '/map/main.min.css.map',
//        sourceMapFilename: 'meteor-app/public/map/style.css.map'
      },
      files: {
        src: "<%= config.cssSrc %>/main.less",
        dest: "<%= config.public %>/main.css"
      }
    },
    uglify: {
      my_target: {
        files: {
          '<%= config.public %>/js/jssavior.min.js': ['<%= config.public %>/js/jssavior.js']
        }
      }
    },
    watch: {
      js: {
        files: ['<%= config.clientSrc %>/views/*.js', 'meteor-app/collections/*.js', 'meteor-app/server/*.js', '<%= config.public %>/js/*.js'],
        tasks: ['jshint']
      },
      uglify: {
        files: ['<%= config.public %>/js/jssavior.js'],
        tasks: ['uglify']
      },
      less: {
        files: ["<%= config.cssSrc %>/*.less", "<%= config.cssSrc %>/*/*.less"],
        tasks: ['less', 'autoprefixer', 'cssmin']
      }
    },
    retire: {
      js: ['meteor-app/client/lib/*'],
      options: {}
    }
  });

  grunt.registerTask('default', ['jshint', 'less', 'autoprefixer', 'cssmin', 'retire', 'uglify', 'watch']);
};
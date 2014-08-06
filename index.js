
var http = require('http'),
    fs = require('fs'),
    doT = require('dot'),
    root = ".",
    path,
    nodeCompareFn = function(otherNode) {
        if(!this.isDirectory && otherNode.isDirectory){
            return 1;
        }
        if(!otherNode.isDirectory && this.isDirectory){
            return -1;
        }
        return this.localeLowerCaseName.localeCompare(otherNode.localeLowerCaseName);
    },
    Node = function(name, stats) {
        this.name = name;
        this.localeLowerCaseName = name.toLocaleLowerCase();
        this.selected = false;
        this.isDirectory = stats.isDirectory();
        this.mtime = stats.mtime;
        this.size = stats.size;
        this.compare = nodeCompareFn;
    },
    indexTemplate = fs.readFileSync('views/index.dot', { encoding: 'utf-8' }),
    indexTemplateFn;

doT.templateSettings.strip = false;

indexTemplateFn = doT.template(indexTemplate);

http.createServer(function(request, response) {
    path = root + decodeURIComponent(request.url);

    path = path.replace(/\/+/, "/");

    if(!path.match(/\/$/)){
        response.writeHead(302, {
          'Location': request.url + "/"
        });
        response.end();
        return;
    }

    fs.exists(path, function(exists){
        if(!exists) {
            response.writeHead(404);
            response.end();
            return;
        }

        fs.readdir(path, function(error, files) {
            response.writeHead(200);
            var nodes = [],
                htmlNodes = '';

            files = files || [];

            for(var i = 0; i < files.length; i += 1){
                node = new Node(files[i], fs.lstatSync(path + files[i]));
                nodes.push(node);
            }

            nodes.sort(function(a,b) {
                return a.compare(b);
            });

            if(path !== root) {
                nodes.splice(0, 0, new Node("..", fs.lstatSync(path + "..")));
            }

            if(nodes.length > 0) {
                nodes[0].selected = true;
            }

            response.write(indexTemplateFn({ nodes: nodes }));
            response.end();
        });
    });

}).listen(8080);
console.log('Listening on port 8080...');

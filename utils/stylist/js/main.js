function include(file) {

	let script = document.createElement('script');
	script.src = file;
	script.type = 'text/javascript';
	script.defer = true;

	document.getElementsByTagName('head').item(0).appendChild(script);

}

const js_files = [
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/js/bootstrap.min.js', 
    'https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/7.2.0/mdb.umd.min.js'
    ];

js_files.forEach(include);
	
filename = window.location.pathname.split('/').pop();
switch(filename) {
	case 'matcher.html':
	  include('js/matcher.js')
	  break;
	case 'y':
	  // code block
	  break;
	default:
	  // code block
  };

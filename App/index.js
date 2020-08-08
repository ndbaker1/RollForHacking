
// Button Listeners for initial page load
window.onload = function() {
    document.getElementById('load-level').addEventListener('click', () => {
        loadPreviewSite(
            document.getElementById('urlbox').value,
            document.getElementById('external-preview')
        )
        setTimeout( () => generateLevel(), 1000 )
    })
}

function loadPreviewSite(url, sitePreviewElement) {
    // making request to get DOM of external url
    const xmlhttp = new XMLHttpRequest()
    // listener/callback for an xmlhttp response
    xmlhttp.onreadystatechange = function() {
        // respond to successfull requests
        if (this.readyState == 4 && this.status == 200) {
            // parse the incoming page into a DOM object
            const parser = new DOMParser();
            const externalDocument = parser.parseFromString(this.responseText,"text/html")
            
            // empty the container and put attach the new site data
            sitePreviewElement.innerHTML = ''
            sitePreviewElement.appendChild(externalDocument.head)
            sitePreviewElement.appendChild(externalDocument.body)
        }
    }
    xmlhttp.open("GET", 'https://cors-anywhere.herokuapp.com/'+url);
    xmlhttp.send();   
}

// parses the current preview site container into an array of playforms
function parseCurrentSite(sitePreviewElement) {
    const levelPlatforms = []
    // recursive DOM crawling parse algorithm
    function parseDOM(elem) {
        const rect = elem.getBoundingClientRect()
        // if the element is too big, look inside it 
        if ( rect.width > 800 || rect.height > 800 ) {
            for (child of elem.children) {
                parseDOM(child)
            }
        // if the element is too small do not consider it 
        // add in am element of randomness to make it unique
        } else if ( rect.width > 20 && rect.height > 20 && Math.random() < 0.6 ) {
            levelPlatforms.push(rect)
        }
    }
    // start parsong on the body of the preview container
    parseDOM(sitePreviewElement.childNodes[1])
    return levelPlatforms
}


var gameLoop
function generateLevel() {
    // clear the previous drawing loop
    clearInterval(gameLoop)
    // The platforms
    let container = document.getElementById('external-preview')
    let platforms = parseCurrentSite(container)
    let canvasWidth = window.innerWidth*.95,
        canvasHeight = window.innerHeight*.85
    // cleanup site preview
    container.innerHTML = ''
    // spawn a bottom bounds platform
    platforms.push({
        x: 0,
        y: canvasHeight-50,
        width: canvasWidth,
        height: 50
    })
    // The attributes of the player.
    var player = {
        x: 500,
        y: 0,
        x_v: 0,
        y_v: 0,
        jump : true,
        height: 20,
        width: 20
    }
    // The status of the arrow keys
    var keys = {
        right: false,
        left: false,
        up: false,
    }
    // The friction and gravity to show realistic movements
    var gravity = 0.6
    var friction = 0.7
    // Function to render the canvas
    function rendercanvas(){
        ctx.fillStyle = "#F0F8FF"
        ctx.fillRect(0, 0, canvasWidth, 3000)
    }
    // Function to render the player
    function renderplayer(){
        ctx.fillStyle = "#F08080";
        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        )
    }
    // Function to render platforms
    function renderplat(){
        ctx.fillStyle = "#45597E";
        for (let i = 0; i < platforms.length; i++){
            ctx.fillRect(
                platforms[i].x,
                platforms[i].y,
                platforms[i].width,
                platforms[i].height
            )
        }
    }
    // This function will be called when a key on the keyboard is pressed
    function keydown(e) {
        // 37 is the code for the left arrow key
        if(e.keyCode == 37)
            keys.left = true;
        // 37 is the code for the up arrow key
        if(e.keyCode == 38)
            if(player.jump == false)
                player.y_v = -10;
        // 39 is the code for the right arrow key
        if(e.keyCode == 39) 
            keys.right = true;
    }
    // This function is called when the pressed key is released
    function keyup(e) {
        if(e.keyCode == 37) 
            keys.left = false
        if(e.keyCode == 38)
            if(player.y_v < -2)
                player.y_v = -3;
        if(e.keyCode == 39) 
            keys.right = false;
    } 
    function loop() {
        // If the player is not jumping apply the effect of frictiom
        if(player.jump == false)
            player.x_v *= friction;
        else // If the player is in the air then apply the effect of gravity
            player.y_v += gravity;

        player.jump = true;
        // If the left key is pressed increase the relevant horizontal velocity
        if(keys.left)
            player.x_v = -2.5;
        if(keys.right)
            player.x_v = 2.5;
        // Updating the y and x coordinates of the player
        player.y += player.y_v;
        player.x += player.x_v;
        // A simple code that checks for collions with the platform
        let i = -1;
        for (let k = 0; k < platforms.length; k++){
            if( platforms[k].x < player.x && player.x < platforms[k].x + platforms[k].width &&
                platforms[k].y < player.y && player.y < platforms[k].y + platforms[k].height){
                i = k
                break
            }
        }
        if (i > -1){
            player.jump = false;
            player.y = platforms[i].y;    
        }
        // Rendering the canvas, the player and the platforms
        rendercanvas();
        renderplayer();
        renderplat();
    }
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    ctx.canvas.height = canvasHeight;
    ctx.canvas.width = canvasWidth;
    // Adding the event listeners
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);
    gameLoop = setInterval(loop, 20);
}



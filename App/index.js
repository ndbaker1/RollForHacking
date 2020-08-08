
// Button Listeners for initial page load
window.onload = function() {
    document.getElementById('load-level').addEventListener('click', () => {
        loadPreviewSite( urlInputValue(), frameDocument() )
        setTimeout( () => generateLevel(), 3000 )
    })
    document.getElementById('urlbox').addEventListener('keydown', (event) => {
        if (event.keyCode == 13){
            loadPreviewSite( urlInputValue(), frameDocument() )
            setTimeout( () => generateLevel(), 3000 )
        }
    })
}

gameViewport = () => {  return document.getElementById("viewport-container") }
urlInputValue = () => { return document.getElementById('urlbox').value }
previewFrame = () => {  return document.getElementById("site-preview-frame") }
frameDocument = () => {
    let frame = previewFrame()
    return (frame.contentDocument || frame.contentWindow.document);
}

function getDOMLinks(DOM) {
    return [].map.call(DOM.getElementsByTagName('a'), elem => elem.href.substring(7))
}

function loadPreviewSite(url, siteFrame) {
    // making request to get DOM of external url
    const xmlhttp = new XMLHttpRequest()
    // listener/callback for an xmlhttp response
    xmlhttp.onreadystatechange = function() {
        // respond to successfull requests
        if (this.readyState == 4 && this.status == 200) {
            // parse the incoming page into a DOM object
            const parser = new DOMParser();
            const externalDOM = parser.parseFromString(this.responseText,"text/html")
            // empty the container and put attach the new site data
            let frameElement = previewFrame()
            frameElement.style.display = 'block'

            siteFrame.head.innerHTML = externalDOM.head.innerHTML
            siteFrame.body = externalDOM.body

            frameElement.style.height = siteFrame.body.scrollHeight + 'px';

            links = getDOMLinks(frameDocument)
            nextlink = links[Math.floor(Math.random()*links.length)]
        }
    }
    // Get around CORS
    xmlhttp.open("GET", 'https://cors-anywhere.herokuapp.com/'+url);
    xmlhttp.send();   
}


// parses the current preview site container into an array of playforms
function parseCurrentSite(siteFrame) {
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
        } else if ( rect.width > 20 && rect.height > 20 && Math.random() < 0.8 ) {
            levelPlatforms.push(rect)
        }
    }
    // start parsong on the body of the preview container
    parseDOM(siteFrame.body)
    return levelPlatforms
}

var nextlink // goal trigger
var gameLoop // game interval timer
function generateLevel() {
    // clear the previous drawing loop
    clearInterval(gameLoop)
    // The platforms
    let container = frameDocument()
    let platforms = parseCurrentSite(container)
    let canvasWidth = container.body.clientWidth,
        canvasHeight = container.body.clientHeight
    // cleanup site preview
    let frameElement = previewFrame()
    container.body.innerHTML = ''
    frameElement.style.height = '0px';
    frameElement.style.display = 'none';
    // spawn a bottom bounds platform
    platforms.push({
        x: 0,
        y: canvasHeight-50,
        width: canvasWidth,
        height: 200
    })
    // The attributes of the player.
    var player = {
        x: 500,
        y: 0,
        x_v: 0,
        y_v: 0,
        jump : true,
        height: 80,
        width: 80
    }

    var camera = {
        pos: canvasHeight
    }
    // The status of the arrow keys
    var keys = {
        right: false,
        left: false,
        up: false,
    }
    // The friction and gravity to show realistic movements
    var gravity = 1
    var friction = 0.7

    // Function to render
    function render(){
        ctx.fillStyle = "#F0F8FF"
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        ctx.fillStyle = "#F08080";
        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        )
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

    function update() {
        // If the player is not jumping apply the effect of frictiom
        if(player.jump == false)
            player.x_v *= friction;
        else // If the player is in the air then apply the effect of gravity
            player.y_v += gravity;

        player.jump = true;
        // If the left key is pressed increase the relevant horizontal velocity
        if(keys.left)
            player.x_v = -5;
        if(keys.right)
            player.x_v = 5;
        // Updating the y and x coordinates of the player
        player.y += player.y_v;
        player.x += player.x_v;

        camera.pos += ( player.y -400 - camera.pos )/10
        // Update the position of the camera relative to the player
        gameViewport().scrollTo(0, camera.pos);
        // A simple code that checks for collions with the platform
        let i = -1;
        for (let k = 0; k < platforms.length; k++){
            if( platforms[k].x < player.x + player.width && player.x < platforms[k].x + platforms[k].width &&
                platforms[k].y < player.y + player.height && player.y < platforms[k].y + platforms[k].height){
                i = k;
                break;
            }
        }
        if (i > -1){
            player.jump = false;
            player.y = platforms[i].y - player.height;
        }
    }

    function keydown(e) {
        // 37 is the code for the left arrow key
        if(e.keyCode == 37)
            keys.left = true;
        // 37 is the code for the up arrow key
        if(e.keyCode == 38)
            if(player.jump == false)
                player.y_v = -20;
        // 39 is the code for the right arrow key
        if(e.keyCode == 39) 
            keys.right = true;
    }

    function keyup(e) {
        if(e.keyCode == 37) 
            keys.left = false
        if(e.keyCode == 38)
            if(player.y_v < -2)
                player.y_v = -5;
        if(e.keyCode == 39) 
            keys.right = false;
    }

    function loop() {
        // update logic and collisions
        update()
        // Rendering the compoenents to the screen
        render()
    }
    // Set configurations for canvas
    canvas = document.getElementById("game-level-canvas");
    ctx = canvas.getContext("2d");
    ctx.canvas.height = canvasHeight;
    ctx.canvas.width = canvasWidth;
    // Add event listeners for controls
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);
    // start the game loop
    gameLoop = setInterval(loop, 20);
}




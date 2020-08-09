const PAGE_LOAD_TIME = 5000 // milliseconds

// Button Listeners for initial page load
window.onload = function() {
    document.getElementById('load-level').addEventListener('click', () => {
        loadPreviewSite( urlInput().value, frameDocument() )
    })
    document.getElementById('urlbox').addEventListener('keydown', (event) => {
        if (event.keyCode == 13){
            loadPreviewSite( urlInput().value, frameDocument() )
        }
    })
    document.getElementById('how-to').addEventListener('click', () => { 
        var popup = document.getElementById("myPopup");
        popup.classList.toggle("show");
    })
}


// element getters
loader = () => { return document.getElementById('parsing-loader') }
gameViewport = () => {  return document.getElementById("viewport-container") }
urlInput = () => { return document.getElementById('urlbox') }
previewFrame = () => {  return document.getElementById("site-preview-frame") }
frameDocument = () => {
    let frame = previewFrame()
    return (frame.contentDocument || frame.contentWindow.document);
}

function getDOMLinks(DOM) {
    console.log(DOM)
    const links = [].map.call(DOM.getElementsByTagName('a'), elem => elem.href)
    return links.filter(link => !link.includes('file'))
}

function loadPreviewSite(url, frameDocument) {
    // change visibility of loader and blur site
    loader().style.display = 'inline-block'
    previewFrame().style.filter = 'blur(3px) brightness(0.7)'
    clearInterval(gameLoop)
    if (canvas !== undefined) canvas.style.display = 'none'

    // making request to get DOM of external url
    const xmlhttp = new XMLHttpRequest()
    // listener/callback for an xmlhttp response
    xmlhttp.onreadystatechange = function() {
        // respond to successfull requests
        if (this.readyState == 4 && this.status == 200) {
            // parse the incoming page into a DOM object
            const parser = new DOMParser();
            const externalDOM = parser.parseFromString(this.responseText,"text/html")

            //  attach the new site data
            let frameElement = previewFrame()
            frameElement.style.display = 'block'
            frameDocument.head.innerHTML = externalDOM.head.innerHTML
            frameDocument.body = externalDOM.body
            frameElement.style.height = frameDocument.body.scrollHeight + 'px';

            // wait for page to load befoer going on
            setTimeout( () => generateLevel(), PAGE_LOAD_TIME )
        }
    }
    // Get around CORS
    xmlhttp.open("GET", 'https://cors-anywhere.herokuapp.com/'+url);
    xmlhttp.send();   
}


// parses the current preview site container into an array of playforms
function parseCurrentSite(frameDocumentBody) {
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
            levelPlatforms.push({
                x: rect.x,
                y: rect.y + 200,
                width: rect.width,
                height: rect.height
            })
        }
    }
    // start parsong on the body of the preview container
    parseDOM(frameDocumentBody)
    return levelPlatforms
}

function getLowestPlatform(platforms) {
    let lowestPlatform = platforms[0]
    for (platform of platforms) {
        if (lowestPlatform.y + lowestPlatform.height < platform.y + platform.height){
            lowestPlatform = platform
        }
    }
    return lowestPlatform
}

function getHighestPlatform(platforms) {
    let highestPlatform = platforms[0]
    for (platform of platforms) {
        if (highestPlatform.y > platform.y){
            highestPlatform = platform
        }
    }
    return highestPlatform
}

var nextlink // goal trigger
var gameLoop // game interval timer
var ctx
var canvas
function generateLevel() {
    links = getDOMLinks(frameDocument())
    nextlink = links[Math.floor(Math.random()*links.length)]
    // The platforms
    let frameDocumentBody = frameDocument().body
    let platforms = parseCurrentSite(frameDocumentBody)
    let lowestPlatform = getLowestPlatform(platforms)
    let highestPlatform = getHighestPlatform(platforms)
    let canvasWidth = frameDocumentBody.clientWidth,
        canvasHeight = lowestPlatform.y + lowestPlatform.height

    // cleanup site preview
    let frameElement = previewFrame()
    frameElement.style.height = '0px';
    frameElement.style.display = 'none';

    for (let k = 0; k < platforms.length; k++) {
        if (platforms[k].y > canvasHeight-200) {
            platforms.pop(k)
        }
    }
    // spawn a bottom bounds platform
    platforms.push({
        x: 0,
        y: canvasHeight-200,
        width: canvasWidth,
        height: 500
    })

    // The attributes of the player.
    let player = {
        x: 100,
        y: canvasHeight-280,
        x_v: 0,
        y_v: 0,
        jump : false,
        grounded : true,
        height: 80,
        width: 80
    }
    // camera object to follow player
    let camera = {
        pos: 0
    }
    // The status of the arrow keys
    let keys = {
        right: false,
        left: false,
        up: false,
    }
    // The friction and gravity to show realistic movements
    let gravity = 1
    let friction = 0.7

    // Function to render
    function render(){
        //Background
        ctx.fillStyle = "#98F5FF"
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        //Player as a square
        ctx.fillStyle = "#F08080";
        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        )
        //Platforms
        for (let i = 0; i < platforms.length; i++){
            ctx.fillStyle = "#855E42";
            ctx.fillRect(
                platforms[i].x,
                platforms[i].y,
                platforms[i].width,
                platforms[i].height
            )
            ctx.fillStyle = "#57a60f";
            ctx.fillRect(
                platforms[i].x,
                platforms[i].y,
                platforms[i].width,
                9
            )
        }
        ctx.fillStyle = "#FFFF00";
        ctx.fillRect(
            highestPlatform.x,
            highestPlatform.y,
            highestPlatform.width,
            highestPlatform.height
        )
    }

    function update() {
        //CAMERA LOGIC
        camera.pos += ( player.y -400 - camera.pos )/10
        // Update the position of the camera relative to the player
        gameViewport().scrollTo(0, camera.pos);

        //PLAYER MOVEMENT
        // If the player is not jumping apply the effect of frictiom
        if(player.grounded == false)
            player.x_v *= friction;
        else // If the player is in the air then apply the effect of gravity
            player.y_v += gravity;

        player.grounded = true;
        // If the left key is pressed increase the relevant horizontal velocity
        if(keys.left)
            player.x_v = -7;
        if(keys.right)
            player.x_v = 7;
        
        // Updating the y and x coordinates of the player
        if(player.y + player.y_v < 0)
            player.y_v = 3;
        if(player.x < 0)
        {
            player.x_v = 7;
            keys.left = false;
            player.jump = true;
        }
            
        if(player.x+player.width > canvas.width)
        {
            player.x_v = -7;
            keys.right = false;
            player.jump = true;
        }
            

        player.y += player.y_v;
        player.x += player.x_v;

        // looping through platforms
        for(let i = 0; i < platforms.length; i++)
        {
            //Collision
            let plat = platforms[i];
            let hitPlat = false
            if(player.y+player.height > plat.y && player.y < plat.y+plat.height && player.x + player.x_v <= plat.x+plat.width && player.x > plat.x+plat.width)//bounce to right
            {
                player.x_v = 7;
                keys.left = false;
                player.jump = true;
                hitPlat = true;
            }
            if(player.y+player.height > plat.y && player.y < plat.y+plat.height && player.x + player.width + player.x_v >=plat.x && player.x+player.width < plat.x)//bounce to left
            {
                player.x_v = -7;
                keys.right = false;
                player.jump = true;
                hitPlat = true;
            }
            if(player.x+player.width > plat.x && player.x < plat.x+plat.width && player.y+player.height < plat.y+plat.height && player.y+player.height+player.y_v>=plat.y)//bounce up
            {
                player.grounded = false;
                player.y_v = player.y_v*-0.5;
                player.jump = true;
                hitPlat = true;
                
            }
            if(player.x+player.width > plat.x && player.x < plat.x+plat.width && player.y > plat.y+plat.height && player.y+player.y_v<=plat.y+plat.height)//bounce down
            {
                player.y_v = 3;
                hitPlat = true;
            }
            //Finding goal
            if (platforms[i] == highestPlatform && hitPlat) {
                urlInput().value = urlInput().value + '-->' +nextlink
                loadPreviewSite( nextlink, frameDocument() )
            }
        }
    }

    function keydown(e) {
        // 37 is the code for the left arrow key
        if(e.keyCode == 37)
            keys.left = true;
        // 37 is the code for the up arrow key
        if(e.keyCode == 32)
        {
            if(player.jump == true)
            {
                player.jump = false;
                player.y_v = -20;
            }
        }
        // 39 is the code for the right arrow key
        if(e.keyCode == 39) 
            keys.right = true;
    }

    function keyup(e) {
        if(e.keyCode == 37) 
            keys.left = false
        // if(e.keyCode == 32)
        //     if(player.y_v < -2)
        //         player.y_v = -5;
        if(e.keyCode == 39) 
            keys.right = false;
    }

    // Main Game Loop
    function loop() {
        update() // update logic and collisions
        render() // Rendering the compoenents to the screen
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
    loader().style.display = 'none'
    previewFrame().style.filter = 'none'
    canvas.style.display = 'block'
    gameLoop = setInterval(loop, 20);
}




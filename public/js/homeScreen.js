import { generateAIImage } from './client.js'; 

export class HomeScreen {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.container = document.createElement('div');
        this.container.id = 'home-screen';
        this.isActive = true;
        this.initialize();
    }
  
    initialize() {
        // Create blur effect container
        const blurContainer = document.createElement('div');
        Object.assign(blurContainer.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '999'
        });
  
        // Create canvas for background render
        const backgroundCanvas = this.renderer.domElement;
        Object.assign(backgroundCanvas.style, {
            filter: 'blur(8px)',
            transform: 'scale(1.1)', // Prevent blur edges
        });
  
        // Style the UI container
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000'
        });
  
        // Create title with glass morphism effect
        const title = document.createElement('h1');
        title.textContent = 'Virtual Art Museum';
        Object.assign(title.style, {
            color: '#ffffff',
            fontSize: '3.5em',
            marginBottom: '2rem',
            fontFamily: 'Arial, sans-serif',
            padding: '2rem 4rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        });
  
        // Create buttons container with glass morphism
        const buttonContainer = document.createElement('div');
        Object.assign(buttonContainer.style, {
            display: 'flex',
            gap: '1.5rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        });
  
        const joinButton = this.createButton('Join Museum');
        // close homescreen 
        joinButton.addEventListener('click', () => {
            this.hide();
            window.dispatchEvent(new Event('joinMuseum')); // Fire event to enable movement
        });

        const addArtButton = this.createButton('Add Art');

        addArtButton.addEventListener('click', () => {
            // Hide the primary button container
            buttonContainer.style.display = 'none';
            title.style.display = 'none';
    
            // Create a new art-container
            const artContainer = document.createElement('div');
            Object.assign(artContainer.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '2rem',
                zIndex: '1001'
            });
    
            // "Upload Picture" button
            const uploadBtn = this.createButton('Upload Picture');
    
            // "Generate Image with AI" button
            const aiBtn = this.createButton('Generate Image with AI');
            aiBtn.addEventListener('click', async () => {
                try {
                    await generateAIImage();
                } catch (error) {
                    console.error('Error generating AI image:', error);
                }
            });
    
            // "Back" button to return to main menu
            const backBtn = this.createButton('Back');
            backBtn.addEventListener('click', () => {
                // Remove art container, bring back main menu
                document.body.removeChild(artContainer);
                buttonContainer.style.display = 'flex';
                title.style.display = 'block';
            });
    
            artContainer.appendChild(uploadBtn);
            artContainer.appendChild(aiBtn);
            artContainer.appendChild(backBtn);
            document.body.appendChild(artContainer);
        });
       
  
        buttonContainer.appendChild(joinButton);
        buttonContainer.appendChild(addArtButton);
        this.container.appendChild(title);
        this.container.appendChild(buttonContainer);
        document.body.appendChild(this.container);
    }
  
    // Keep the createButton method as part of the class
    createButton(text) {
        const button = document.createElement('button');
        button.textContent = text;
        Object.assign(button.style, {
            padding: '1rem 2.5rem',
            fontSize: '1.2em',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'black',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(5px)'
        });
  
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            button.style.transform = 'scale(1.05)';
        });
  
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            button.style.transform = 'scale(1)';
        });
  
        return button;
    }
    
  
    show() {
        this.isActive = true;
        this.container.style.opacity = '1';
        this.renderer.domElement.style.filter = 'blur(8px)';
        this.renderer.domElement.style.transform = 'scale(1.1)';
        document.body.appendChild(this.container);
    }
  
    hide() {
        this.isActive = false;  
        this.container.style.opacity = '0';
        this.renderer.domElement.style.filter = 'none';
        this.renderer.domElement.style.transform = 'none';
    
        setTimeout(() => {
            this.container.remove();
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('prototypeForm');
    const fileInput = document.getElementById('file');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const filePreview = document.getElementById('filePreview');
    const generateBtn = document.getElementById('generateBtn');
    const loading = document.getElementById('loading');
    const outputSection = document.getElementById('outputSection');
    const outputContent = document.getElementById('outputContent');
    const copyBtn = document.getElementById('copyBtn');

    // File upload drag and drop functionality
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect(files[0]);
        }
    });

    // File input change handler
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Handle file selection
    function handleFileSelect(file) {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'application/pdf', 'text/plain'];
        const maxSize = 16 * 1024 * 1024; // 16MB

        if (!allowedTypes.includes(file.type)) {
            showMessage('Please select a valid file type (PNG, JPG, JPEG, GIF, PDF, TXT)', 'error');
            return;
        }

        if (file.size > maxSize) {
            showMessage('File size must be less than 16MB', 'error');
            return;
        }

        // Show file preview
        filePreview.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file"></i>
                <span>${file.name} (${formatFileSize(file.size)})</span>
                <button type="button" class="remove-file" onclick="removeFile()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        filePreview.classList.add('show');
    }

    // Remove file
    window.removeFile = function() {
        fileInput.value = '';
        filePreview.classList.remove('show');
        filePreview.innerHTML = '';
    };

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            this.classList.add('active');
            document.getElementById(targetTab + 'Tab').classList.add('active');
        });
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const prompt = document.getElementById('prompt').value.trim();
        if (!prompt) {
            showMessage('Please enter a prompt', 'error');
            return;
        }

        // Show loading state
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        loading.style.display = 'block';
        outputSection.style.display = 'none';

        // Prepare form data
        const formData = new FormData(form);

        // Send request
        fetch('/generate', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Display the code in the code tab
                outputContent.textContent = data.html_code;
                
                // Load the prototype in the iframe
                const prototypeFrame = document.getElementById('prototypeFrame');
                prototypeFrame.src = data.prototype_url;
                
                // Show output section and switch to preview tab
                outputSection.style.display = 'block';
                
                // Switch to preview tab by default
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                document.querySelector('[data-tab="preview"]').classList.add('active');
                document.getElementById('previewTab').classList.add('active');
                
                showMessage('Prototype generated successfully!', 'success');
                
                // Scroll to output
                outputSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                showMessage(data.error || 'An error occurred', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Network error. Please try again.', 'error');
        })
        .finally(() => {
            // Reset button state
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Prototype';
            loading.style.display = 'none';
        });
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', function() {
        const text = outputContent.textContent;
        navigator.clipboard.writeText(text).then(function() {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.style.background = '#10b981';
            copyBtn.style.color = 'white';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '';
                copyBtn.style.color = '';
            }, 2000);
        }).catch(function(err) {
            console.error('Could not copy text: ', err);
            showMessage('Failed to copy to clipboard', 'error');
        });
    });

    // Show message function
    function showMessage(text, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const message = document.createElement('div');
        message.className = `message ${type} show`;
        message.textContent = text;

        // Insert at the top of main content
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(message, mainContent.firstChild);

        // Auto remove after 5 seconds
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => message.remove(), 300);
        }, 5000);
    }

    // Auto-resize textarea
    const textarea = document.getElementById('prompt');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 300) + 'px';
    });

    // Add some example prompts
    const examples = [
        "Create a mobile app for food delivery with modern UI and dark theme",
        "Design a dashboard for project management with charts and task lists",
        "Build a landing page for a SaaS product with pricing tiers",
        "Create an e-commerce product page with image gallery and reviews",
        "Design a social media profile page with posts and followers"
    ];

    // Add example button functionality
    function addExamplePrompts() {
        const exampleContainer = document.createElement('div');
        exampleContainer.className = 'example-prompts';
        exampleContainer.innerHTML = `
            <p style="margin-bottom: 10px; color: #666; font-size: 0.9rem;">
                <i class="fas fa-lightbulb"></i> Try these examples:
            </p>
        `;

        examples.forEach(example => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'example-btn';
            button.textContent = example;
            button.style.cssText = `
                display: block;
                width: 100%;
                margin-bottom: 8px;
                padding: 8px 12px;
                background: #f8faff;
                border: 1px solid #e1e5e9;
                border-radius: 6px;
                text-align: left;
                cursor: pointer;
                font-size: 0.85rem;
                color: #555;
                transition: all 0.2s ease;
            `;
            
            button.addEventListener('mouseenter', function() {
                this.style.background = '#667eea';
                this.style.color = 'white';
                this.style.borderColor = '#667eea';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.background = '#f8faff';
                this.style.color = '#555';
                this.style.borderColor = '#e1e5e9';
            });
            
            button.addEventListener('click', function() {
                textarea.value = example;
                textarea.focus();
                textarea.dispatchEvent(new Event('input'));
            });
            
            exampleContainer.appendChild(button);
        });

        // Insert after the textarea
        textarea.parentNode.insertBefore(exampleContainer, textarea.nextSibling);
    }

    // Add examples when textarea is empty and focused
    textarea.addEventListener('focus', function() {
        if (!this.value.trim() && !document.querySelector('.example-prompts')) {
            addExamplePrompts();
        }
    });

    textarea.addEventListener('blur', function() {
        setTimeout(() => {
            const examplePrompts = document.querySelector('.example-prompts');
            if (examplePrompts && !this.value.trim()) {
                examplePrompts.remove();
            }
        }, 200);
    });
});

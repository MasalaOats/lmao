<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Chat Viewer</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #ECE5DD;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: auto; /* Change to auto for better mobile responsiveness */
            margin: 0;
            padding: 10px; /* Add some padding for mobile */
        }
        #chat-window {
            width: 100%; /* Make it responsive */
            max-width: 600px; /* Maximum width for larger screens */
            height: 60vh;
            border: 1px solid #ccc;
            border-radius: 8px;
            background-color: #fff;
            overflow-y: scroll;
            padding: 10px;
        }
        .message-bubble {
            margin: 10px;
            padding: 10px;
            border-radius: 8px;
            max-width: 80%;
            word-wrap: break-word;
            display: inline-block;
            clear: both;
            position: relative;
        }
        .message-left {
            background-color: #25D366;
            color: white;
            text-align: left;
            float: left;
        }
        .message-right {
            background-color: #34B7F1;
            color: white;
            text-align: right;
            float: right;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        .date-separator {
            text-align: center;
            color: gray;
            font-size: 12px;
            margin: 20px 0;
        }
        .img-thumbnail {
            max-width: 100%; /* Make images responsive */
            max-height: 200px;
            margin: 5px 0;
            cursor: pointer;
            display: block;
            clear: both;
        }
        .timestamp {
            position: absolute;
            right: 10px;
            bottom: 5px;
            font-size: 10px;
            color: black; /* Change color to black */
        }
        .button-container {
            margin-bottom: 20px;
        }
        button {
            margin: 5px;
            padding: 10px 15px;
            font-size: 16px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h2>WhatsApp Chat Viewer</h2>

    <!-- Button container -->
    <div class="button-container">
        <input type="file" id="folderInput" webkitdirectory directory />
        <button id="clearChat">Clear Chat</button>
    </div>

    <!-- Chat display window -->
    <div id="chat-window"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script>
        const chatWindow = document.getElementById('chat-window');
        const folderInput = document.getElementById('folderInput');
        const clearChatButton = document.getElementById('clearChat');

        let imageMap = {}; // Store images keyed by their file names

        // Handle folder selection
        folderInput.addEventListener('change', function(event) {
            const files = event.target.files;

            const zip = new JSZip();

            // Read files into a zip structure
            Array.from(files).forEach(file => {
                zip.file(file.name, file);
            });

            // Process the zip contents
            zip.forEach((relativePath, zipEntry) => {
                console.log(`Processing file: ${zipEntry.name}`); // Debugging statement

                if (zipEntry.name.endsWith('.txt')) {
                    zipEntry.async('text').then(content => {
                        console.log("Chat file content loaded"); // Debugging statement
                        displayChat(content); // Process and display chat content
                    });
                } else if (zipEntry.name.startsWith('IMG-') && zipEntry.name.endsWith('.jpg')) {
                    zipEntry.async('base64').then(data => {
                        imageMap[zipEntry.name] = `data:image/jpeg;base64,${data}`; // Map image file names to data URLs
                        console.log(`Loaded image: ${zipEntry.name}`); // Debugging statement
                    });
                }
            });
        });

        // Clear the existing chat
        clearChatButton.addEventListener('click', function() {
            chatWindow.innerHTML = ''; // Clear chat window
            imageMap = {}; // Clear the image map
            folderInput.value = ''; // Reset file input
        });

        // Function to display the chat from text content
        function displayChat(content) {
            chatWindow.innerHTML = ''; // Clear previous content
            const lines = content.split('\n');
            let currentDate = null;

            lines.forEach(line => {
                const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/); // Match DD/MM/YYYY date format
                const timeMatch = line.match(/(\d{1,2}:\d{2}\s(?:AM|PM))/); // Match HH:MM AM/PM time format
                const senderMatch = line.match(/-\s(.+?):/); // Match sender
                const timeText = timeMatch ? timeMatch[1] : ''; // Extract time or leave empty
                const senderText = senderMatch ? senderMatch[1] : ''; // Extract sender or leave empty

                if (dateMatch) {
                    const newDate = dateMatch[1];
                    if (newDate !== currentDate) {
                        createDateSeparator(newDate);
                        currentDate = newDate;
                    }
                }

                const mediaMatch = line.match(/(IMG-\d{8}-WA\d{4}\.jpg)/); // Match media filenames
                if (mediaMatch) {
                    const mediaFileName = mediaMatch[1];
                    if (imageMap[mediaFileName]) {
                        createMediaBubble(mediaFileName, imageMap[mediaFileName], timeText, senderText);
                    } else {
                        console.error(`Image not found: ${mediaFileName}`); // Debugging statement
                        createTextBubble(`${mediaFileName} (Media file not found)`, senderText, timeText);
                    }
                } else {
                    createTextBubble(line, senderText, timeText); // Assume messages are from the other person
                }
            });
        }

        // Create a date separator in the chat
        function createDateSeparator(dateText) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'date-separator';
            dateDiv.textContent = dateText;
            chatWindow.appendChild(dateDiv);
        }

        // Create a text message bubble with timestamp
        function createTextBubble(message, sender, timeText) {
            const bubble = document.createElement('div');
            bubble.className = `message-bubble message-left clearfix`;
            bubble.textContent = `${sender}: ${message}`;

            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.textContent = timeText;
            bubble.appendChild(timestamp);

            chatWindow.appendChild(bubble);
            chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the bottom
        }

        // Create a media message bubble (for images) with timestamp
        function createMediaBubble(fileName, imgDataURL, timeText, sender) {
            const bubble = document.createElement('div');
            bubble.className = `message-bubble message-left clearfix`;

            const img = document.createElement('img');
            img.className = 'img-thumbnail';
            img.src = imgDataURL;
            img.alt = fileName;

            img.onclick = function() {
                openImageModal(imgDataURL);
            };

            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.textContent = timeText;

            bubble.appendChild(img);
            bubble.appendChild(timestamp);
            chatWindow.appendChild(bubble);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        // Function to open an image in a new window
        function openImageModal(imgDataURL) {
            const imgWindow = window.open("");
            imgWindow.document.write(`<img src="${imgDataURL}" style="max-width:100%">`);
        }
    </script>
</body>
</html>

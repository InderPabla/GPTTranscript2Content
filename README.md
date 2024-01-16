# GPT Transcript to Content

This is a command-line tool for converting transcripts into content using GPT-3.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [License](#license)

## Prerequisites

Before using this tool, ensure you have the following prerequisites installed on your system:
- [Node.js](https://nodejs.org/) (>=14.17.0)
- [FFMPEG](https://www.ffmpeg.org/download.html) (Executable path should be specified)

## Installation

To install this tool, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/InderPabla/GPTTranscript2Content.git

2. Navigate to the project directory:

   ```bash
   cd GPTTranscript2Content

3. Install the required Node.js packages:

   ```bash
   npm install
   
## Usage
Once you have installed the tool and met the prerequisites, you can use it to convert transcripts into content using GPT-3.

To get started, run the following command:

    Options
    -i, --imagePrompt <imagePrompt>: Image Prompt (Specify an image prompt for GPT-3)
    -t, --transcriptFile <transcriptFile>: Transcript File (Specify the transcript file to be converted)
    -f, --ffmpeg <ffmpeg>: FFMPEG.exe path (Specify the path to the FFMPEG executable)
    -s, --toSpeech: Convert transcript to speech (Enable this option to convert the transcript to speech)
    For example, to convert a transcript to content with an image prompt and FFMPEG path, you can use the following command:

    npm start -- --imagePrompt="Create an image of a fractal world with unparalleled confusion."
        - Create an image given a prompt

    npm start -- --transcriptFile="./content/wheel-transcript.txt" --ffmpeg="/path/to/ffmpeg.exe"
        - Create a video and list of images given a transcript

    npm start -- --transcriptFile="./content/wheel-transcript.txt" --toSpeech
        - Create an audio .mp3 from a given transcript



## License
This project is licensed under the MIT License.
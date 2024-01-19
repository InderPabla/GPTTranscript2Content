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
   
4. Add OPENAI_API_KEY in environment variables
    ```bash
    Ex: In powershell
    $Env:OPENAI_API_KEY = "<OPENAI_API_KEY>"

## Usage
Once you have installed the tool and met the prerequisites, you can use it to convert transcripts into content using GPT-3.

To get started, run the following command:

    ### Options
    - `-t, --transcriptFile <transcriptFile>`: Transcript File (Specify the transcript file to be converted)
    - `-f, --ffmpeg <ffmpeg>`: FFMPEG.exe path (Specify the path to the FFMPEG executable)
    - `-s, --toSpeech`: Convert transcript to speech (Enable this option to convert the transcript to speech)
    - `-v, --toVideo`: Convert transcript to video (Enable this option to convert the transcript to video)
    - `-u, --toImages`: Convert transcript to images (Enable this option to convert the transcript to images)

    For example, to convert a transcript to content with an image prompt and FFMPEG path, you can use the following command:

    npm start --transcriptFile="./transcripts/wheel-transcript.txt" --ffmpeg="/path/to/ffmpeg.exe" --toVideo --toSpeech
        - Create a speech and video animation given transcript and ffmpeg path



## License
This project is licensed under the MIT License.
# Speed Typing Test

A modern web application for testing and improving typing speed and accuracy. Built with Flask and vanilla JavaScript, featuring real-time feedback and detailed performance analytics.

## �� Features

- **Real-time Typing Test**: Test your typing speed with randomly selected text passages
- **Multiple Test Durations**: Choose from 30 seconds, 1 or 3-minute tests
- **Live Performance Tracking**: Real-time WPM (Words Per Minute) and accuracy calculation
- **Visual Feedback**: Immediate visual feedback for correct/incorrect keystrokes
- **Audio Feedback**: Error sound effects for incorrect characters
- **Detailed Results**: Comprehensive results page with performance metrics
- **Responsive Design**: Works seamlessly on desktop (needs some fixes to clearly work on mobile devices)
- **Educational Content**: Learn typing techniques and best practices

## 📊 Performance Metrics

The application tracks and displays:
- **WPM (Words Per Minute)**: Standard typing speed measurement
- **Accuracy**: Percentage of correctly typed characters
- **Time Taken**: Total duration of the test
- **Character Count**: Breakdown of correct vs incorrect characters

## 🛠️ Technology Stack

### Backend
- **Flask 3.1.2**: Python web framework
- **Python 3.x**: Core programming language
- **Jinja2**: Template engine

### Frontend
- **Vanilla JavaScript**: No frameworks, pure ES6+ JavaScript
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with responsive design
- **Web Audio API**: For error sound effects

### Dependencies
- Flask
- python-dotenv
- blinker
- Werkzeug


## 🚀 Installation & Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/tamer_7rd/SpeedTypingTest.git
   cd SpeedTypingTest
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python main.py
   ```

5. **Open your browser**
   Navigate to `http://localhost:5001`

## 🎯 How to Use

1. **Start a Test**: Click on one of the duration buttons
2. **Type the Text**: Begin typing the displayed text as accurately as possible
3. **Real-time Feedback**: See immediate visual feedback for each keystroke
4. **View Results**: After the timer ends, you'll be redirected to your results page

## 🎨 Key Features Explained

### Typing Interface
- **Invisible Input Field**: Captures keystrokes without visual interference
- **Custom Caret**: Visual indicator showing current typing position
- **Character-by-Character Validation**: Real-time feedback for each keystroke
- **Backspace Support**: Ability to correct mistakes during the test

### Audio System
- **Error Feedback**: Beep sound for incorrect characters
- **Throttled Audio**: Prevents audio overlap during rapid typing
- **Cross-browser Compatibility**: Works with Web Audio API

### Performance Calculation
- **WPM Formula**: `(correct characters / 5) / time * 60`
- **Accuracy Formula**: `(correct characters / total characters) * 100`
- **Real-time Updates**: Continuous calculation during the test

## ⚙️ Configuration

### Customizing Test Texts
Edit `static/assets/data.json` to add or modify text passages:
```json
{
  "paragraphs": [
    "Your custom text here...",
    "Another paragraph...",
    "More text passages..."
  ]
}
```

### Modifying Test Duration
Edit the countdown logic in `static/js/script.js`:
```javascript
let value = (time === '3') ? 179 : +time -1; // 179 seconds = 3 minutes
```

## 🐛 Troubleshooting

### Common Issues

1. **Audio not working**
   - Ensure browser supports Web Audio API
   - Check if autoplay is blocked in browser settings

2. **Text not loading**
   - Verify `static/assets/data.json` exists and is valid JSON
   - Check browser console for fetch errors

3. **Port already in use**
   - Change port in `main.py`: `app.run(debug=True, port=5002)`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👨‍💻 Author

Tamerlan Ord
- GitHub: [@tamer_7rd](https://github.com/tamer_7rd)
- Email: tamerlan4496@gmail.com

**Happy Typing! ⌨️**
```



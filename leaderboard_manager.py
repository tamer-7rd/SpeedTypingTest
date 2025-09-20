import json
import os
from datetime import datetime


class LeaderboardManager():
  """Manages leaderboard data storage and operations"""
  
  def __init__(self):
    self.leaderboard_file = os.path.join('instance', 'leaderboard.json')
    self.max_entries = 50
    self.max_storage = None

  def load_leaderboard(self):  
    """Load leaderboard data from JSON file"""
    if os.path.exists(self.leaderboard_file):
      try: 
        with open(self.leaderboard_file, 'r') as file:
          return json.load(file)
      except (json.JSONDecodeError, FileNotFoundError):
        return []
    return []    

  def save_leaderboard(self, data):
    """Save leaderboard data to JSON file"""
    # Create instance directory if it doesn't exist
    os.makedirs('instance', exist_ok=True)
    with open(self.leaderboard_file, 'w') as file:
      json.dump(data, file, indent=2)

  def is_duplicate(self, leaderboard, username, wpm, acc, coef):
    """Check if an entry with the same username and exact scores already exists"""
    for entry in leaderboard:
      if (entry['username'] == username and 
          entry['wpm'] == wpm and 
          entry['accuracy'] == acc and 
          entry['coef'] == coef):
        return True
    return False

  def find_user_position(self, leaderboard, username, wpm, acc, coef):
    """Find the position (rank) of a specific user entry in the leaderboard"""
    user_position = None
    for i, entry in enumerate(leaderboard):
        if (entry['username'] == username and 
          entry['wpm'] == wpm and 
          entry['accuracy'] == acc and 
          entry['coef'] == coef):
          user_position = i + 1
          break
    return user_position  

  def add_to_leaderboard(self, username, email, country, wpm, acc, coef):
    """Add a new entry to the leaderboard and return updated leaderboard with user position"""
    leaderboard = self.load_leaderboard()

    if self.is_duplicate(leaderboard, username, wpm, acc, coef):
      user_position = self.find_user_position(leaderboard, username, wpm, acc, coef)
      return leaderboard, user_position

    new_entry = {
      "username": username,
      "email": email,
      "country": country,
      "wpm": wpm,
      "accuracy": acc,
      "coef": coef,
      "timestamp": datetime.now().isoformat(),
      "date": datetime.now().strftime('%Y-%m-%d %H:%M'),
    }

    # Add new entry and sort by coefficient (score) in descending order
    leaderboard.append(new_entry)
    leaderboard.sort(key=lambda obj: obj['coef'], reverse=True)
    # Keep only the top entries (limit to max_entries)
    leaderboard = leaderboard[:self.max_entries]   
    self.save_leaderboard(leaderboard)             

    # Find the position of the newly added entry
    user_position = self.find_user_position(leaderboard, 
                                            new_entry['username'], 
                                            new_entry['wpm'], 
                                            new_entry['accuracy'], 
                                            new_entry['coef'])

    return leaderboard, user_position
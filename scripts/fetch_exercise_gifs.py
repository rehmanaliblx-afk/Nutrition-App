#!/usr/bin/env python3
"""
Usage:
  pip install requests
  python fetch_exercise_gifs.py

Output: exercise_gifs.json
"""

import json
import os
import time
import requests

API_KEY = os.environ.get("RAPIDAPI_KEY", "f4058533c4msh7e143cec42fd316p105734jsne3baf10e7a9c")

HEADERS = {
    "x-rapidapi-host": "exercisedb.p.rapidapi.com",
    "x-rapidapi-key": API_KEY,
}

# All 102 exercises: local_id -> exercise name to search in ExerciseDB
EXERCISES = {
    "barbell_bench_press":       "Barbell Bench Press",
    "incline_dumbbell_press":    "Incline Dumbbell Press",
    "cable_fly":                 "Cable Fly",
    "push_up":                   "Push-Up",
    "dips":                      "Dips",
    "deadlift":                  "Deadlift",
    "pull_up":                   "Pull-Up",
    "barbell_row":               "Barbell Row",
    "lat_pulldown":              "Lat Pulldown",
    "seated_cable_row":          "Seated Cable Row",
    "face_pull":                 "Face Pull",
    "overhead_press":            "Overhead Press",
    "lateral_raise":             "Lateral Raise",
    "front_raise":               "Front Raise",
    "rear_delt_fly":             "Rear Delt Fly",
    "arnold_press":              "Arnold Press",
    "barbell_curl":              "Barbell Curl",
    "hammer_curl":               "Hammer Curl",
    "incline_dumbbell_curl":     "Incline Dumbbell Curl",
    "concentration_curl":        "Concentration Curl",
    "tricep_pushdown":           "Tricep Pushdown",
    "skull_crusher":             "Skull Crusher",
    "overhead_tricep_extension": "Overhead Tricep Extension",
    "close_grip_bench":          "Close-Grip Bench Press",
    "squat":                     "Barbell Back Squat",
    "leg_press":                 "Leg Press",
    "romanian_deadlift":         "Romanian Deadlift",
    "leg_curl":                  "Lying Leg Curl",
    "leg_extension":             "Leg Extension",
    "walking_lunge":             "Walking Lunge",
    "calf_raise":                "Standing Calf Raise",
    "hip_thrust":                "Hip Thrust",
    "glute_bridge":              "Glute Bridge",
    "bulgarian_split_squat":     "Bulgarian Split Squat",
    "cable_kickback":            "Cable Kickback",
    "plank":                     "Plank",
    "crunch":                    "Crunch",
    "russian_twist":             "Russian Twist",
    "hanging_leg_raise":         "Hanging Leg Raise",
    "ab_wheel_rollout":          "Ab Wheel Rollout",
    "treadmill_run":             "Treadmill Run",
    "jump_rope":                 "Jump Rope",
    "cycling":                   "Stationary Bike",
    "burpee":                    "Burpee",
    "clean_and_press":           "Clean and Press",
    "turkish_getup":             "Turkish Get-Up",
    "thruster":                  "Thruster",
    "decline_bench_press":       "Decline Bench Press",
    "pec_deck_fly":              "Pec Deck",
    "dumbbell_fly":              "Dumbbell Fly",
    "chest_press_machine":       "Chest Press",
    "single_arm_dumbbell_row":   "Single Arm Dumbbell Row",
    "chest_supported_row":       "Chest Supported Row",
    "cable_pullover":            "Cable Pullover",
    "t_bar_row":                 "T-Bar Row",
    "straight_arm_pulldown":     "Straight Arm Pulldown",
    "upright_row":               "Upright Row",
    "cable_lateral_raise":       "Cable Lateral Raise",
    "dumbbell_shoulder_press":   "Dumbbell Shoulder Press",
    "reverse_fly":               "Reverse Fly",
    "ez_bar_curl":               "EZ Bar Curl",
    "preacher_curl":             "Preacher Curl",
    "cable_curl":                "Cable Curl",
    "spider_curl":               "Spider Curl",
    "tricep_dips":               "Tricep Dips",
    "cable_overhead_extension":  "Cable Overhead Tricep Extension",
    "diamond_pushup":            "Diamond Push-Up",
    "kickback":                  "Tricep Kickback",
    "hack_squat":                "Hack Squat",
    "front_squat":               "Front Squat",
    "sumo_deadlift":             "Sumo Deadlift",
    "step_up":                   "Step-Up",
    "seated_calf_raise":         "Seated Calf Raise",
    "donkey_calf_raise":         "Donkey Calf Raise",
    "good_morning":              "Good Morning",
    "cable_pull_through":        "Cable Pull-Through",
    "single_leg_hip_thrust":     "Single Leg Hip Thrust",
    "sumo_squat":                "Sumo Squat",
    "lateral_band_walk":         "Lateral Band Walk",
    "cable_crunch":              "Cable Crunch",
    "bicycle_crunch":            "Bicycle Crunch",
    "pallof_press":              "Pallof Press",
    "dead_bug":                  "Dead Bug",
    "woodchop":                  "Cable Woodchop",
    "dragon_flag":               "Dragon Flag",
    "power_clean":               "Power Clean",
    "kettlebell_swing":          "Kettlebell Swing",
    "man_maker":                 "Man Maker",
    "battle_ropes":              "Battle Ropes",
    "rowing_machine":            "Rowing Machine",
    "stair_climber":             "Stair Climber",
    "box_jump":                  "Box Jump",
    "incline_bench_press":       "Incline Bench Press",
    "romanian_deadlift_db":      "Dumbbell Romanian Deadlift",
    "face_pull_rope":            "Face Pull",
    "zottman_curl":              "Zottman Curl",
    "reverse_curl":              "Reverse Curl",
    "sissy_squat":               "Sissy Squat",
    "nordic_curl":               "Nordic Hamstring Curl",
    "glute_ham_raise":           "Glute Ham Raise",
    "cable_row_wide":            "Wide Grip Cable Row",
    "landmine_press":            "Landmine Press",
}


def fetch_gif_url(exercise_name: str) -> str | None:
    search_name = exercise_name.lower().replace("-", " ").replace("(", "").replace(")", "")
    url = f"https://exercisedb.p.rapidapi.com/exercises/name/{requests.utils.quote(search_name)}"
    try:
        resp = requests.get(url, headers=HEADERS, params={"limit": 5, "offset": 0}, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            if data and isinstance(data, list) and len(data) > 0:
                gif = data[0].get("gifUrl")
                return gif
        else:
            print(f"  HTTP {resp.status_code}")
    except Exception as e:
        print(f"  Error: {e}")
    return None


def main():
    results = {}
    failed = []
    total = len(EXERCISES)

    print(f"Fetching GIF URLs for {total} exercises...\n")

    for i, (ex_id, ex_name) in enumerate(EXERCISES.items(), 1):
        print(f"[{i:3}/{total}] {ex_name}...", end=" ", flush=True)
        gif_url = fetch_gif_url(ex_name)
        if gif_url:
            results[ex_id] = gif_url
            print(f"OK")
        else:
            failed.append((ex_id, ex_name))
            print(f"FAILED")
        # Stay within free tier: 10 req/sec max
        time.sleep(0.15)

    print(f"\n--- Done: {len(results)} found, {len(failed)} failed ---\n")

    if failed:
        print("Failed exercises (will need manual lookup):")
        for ex_id, ex_name in failed:
            print(f"  {ex_id}: {ex_name}")
        print()

    out_path = "exercise_gifs.json"
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Saved to {out_path}")
    print(f"\nNext step: copy exercise_gifs.json to src/constants/ in the app")


if __name__ == "__main__":
    main()

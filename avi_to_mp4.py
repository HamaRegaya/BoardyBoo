import subprocess
import sys
import os
import imageio_ffmpeg

input_file = r"C:\Users\hachichaMed\Videos\2026-03-10 02-40-50.avi"
output_file = os.path.splitext(input_file)[0] + ".mp4"

if not os.path.isfile(input_file):
    print(f"Error: Input file not found: {input_file}")
    sys.exit(1)

ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

cmd = [
    ffmpeg_path,
    "-i", input_file,
    "-c:v", "libx264",
    "-c:a", "aac",
    "-preset", "medium",
    "-crf", "23",
    output_file,
]

print(f"Converting:\n  {input_file}\n  -> {output_file}")
subprocess.run(cmd, check=True)
print("Done!")

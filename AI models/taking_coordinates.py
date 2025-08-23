import cv2

# Load your interface screenshot
img = cv2.imread("Screenshot 2025-08-20 191946.png")

buttons = {}
clicks = []

def click_event(event, x, y, flags, param):
    global clicks
    if event == cv2.EVENT_LBUTTONDOWN:
        clicks.append((x, y))
        print(f"Clicked: {x}, {y}")
        
        # Draw red circle
        cv2.circle(img, (x, y), 5, (0, 0, 255), -1)
        cv2.imshow("Interface", img)

        # If two clicks → top-left + bottom-right
        if len(clicks) == 2:
            top_left, bottom_right = clicks
            name = input("Enter button label: ")
            buttons[name] = (top_left[0], top_left[1], bottom_right[0], bottom_right[1])
            print(f"Stored: {name} → {buttons[name]}")
            clicks.clear()  # reset for next button


cv2.imshow("Interface", img)
cv2.setMouseCallback("Interface", click_event)

print("👉 Instructions: Left-click twice to mark button, type label in terminal.")
print("   Press 'q' or ESC in the OpenCV window when done.\n")

while True:
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q') or key == 27:  # q or ESC
        break

cv2.destroyAllWindows()

# ✅ Save to Python file instead of JSON
with open("buttons.py", "w") as f:
    f.write("buttons = {\n")
    for name, coords in buttons.items():
        f.write(f'    "{name}": {coords},\n')
    f.write("}\n")

print("\n✅ Final button coordinates saved to buttons.py")

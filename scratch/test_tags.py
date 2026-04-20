import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from services.mailer import replace_merge_tags

def test_replacement():
    test_cases = [
        ("Dear {{name}},", "John Doe", "Dear John Doe,"),
        ("Hello {{Name}}!", "Alice", "Hello Alice!"),
        ("Hi {{  name  }}.", "Bob", "Hi Bob."),
        ("Welcome {{ NAME }}, stay active.", "Eve", "Welcome Eve, stay active."),
        ("No tags here.", "Charlie", "No tags here."),
        ("Multiple {{name}} and {{ name }} tags.", "Dave", "Multiple Dave and Dave tags."),
        ("", "Frank", ""),
        (None, "Grace", None),
    ]
    
    print("Running Merge Tag Replacement Tests...")
    all_passed = True
    for text, name, expected in test_cases:
        result = replace_merge_tags(text, name)
        if result == expected:
            print(f"✅ PASSED: '{text}' -> '{result}'")
        else:
            print(f"❌ FAILED: '{text}' -> expected '{expected}', bot got '{result}'")
            all_passed = False
            
    if all_passed:
        print("\nAll tests passed successfully!")
    else:
        print("\nSome tests failed.")
        sys.exit(1)

if __name__ == "__main__":
    test_replacement()

"""
Script to update the HTML template in Supabase
Run this after creating/updating the HTML template file
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def main():
    # Read the HTML template
    with open("templates/nda_short_form.html", "r", encoding="utf-8") as f:
        html_content = f.read()
    
    # Connect to Supabase
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Update the template
    # Assuming template_id = '761c6656-a865-4f0c-927d-0d375df37d62'
    result = supabase.table("templates").update({
        "html_template": html_content
    }).eq("name", "NDA (Short-Form Mutual)").execute()
    
    print("✅ HTML template updated successfully!")
    print(f"Updated {len(result.data)} template(s)")
    
    if result.data:
        print(f"Template ID: {result.data[0]['id']}")
        print(f"Template Name: {result.data[0]['name']}")

if __name__ == "__main__":
    main()


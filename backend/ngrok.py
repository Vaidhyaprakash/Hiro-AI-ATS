import requests


def update_ngrok_url():
    try:
        # Get ngrok public url from its API
        response = requests.get("http://localhost:4040/api/tunnels")
        tunnels = response.json()["tunnels"]
        
        # Get the HTTPS tunnel URL
        ngrok_url = next(
            tunnel["public_url"]
            for tunnel in tunnels 
            if tunnel["proto"] == "https"
        )
        
        # Read existing .env file
        with open('.env', 'r') as file:
            env_lines = file.readlines()
        
        # Update or add NGROK_URL
        ngrok_url_found = False
        for i, line in enumerate(env_lines):
            if line.startswith('NGROK_URL='):
                env_lines[i] = f'NGROK_URL={ngrok_url}\n'
                ngrok_url_found = True
                break
        
        if not ngrok_url_found:
            env_lines.append(f'NGROK_URL={ngrok_url}\n')
        
        # Write back to .env file
        with open('.env', 'w') as file:
            file.writelines(env_lines)
            
        print(f"Updated NGROK_URL to {ngrok_url}")
        return ngrok_url
        
    except Exception as e:
        print(f"Error updating ngrok URL: {str(e)}")
        return None
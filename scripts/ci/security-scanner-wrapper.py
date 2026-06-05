import subprocess
def run_security_scans():
    tools = ['bandit -r src/', 'snyk test', 'sonar-scanner']
    for tool in tools:
        print(f"Running {tool}...")
        subprocess.run(tool.split(), check=True)
if __name__ == '__main__':
    run_security_scans()
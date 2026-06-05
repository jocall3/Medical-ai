import subprocess
def provision_env():
    print("Provisioning Docker containers and Python virtual environments...")
    subprocess.run(['docker-compose', 'up', '-d'])
if __name__ == '__main__':
    provision_env()
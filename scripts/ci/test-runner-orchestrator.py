import subprocess
def run_tests():
    suites = ['unit', 'integration', 'clinical_simulation']
    for suite in suites:
        print(f"Executing {suite} tests...")
        subprocess.run(['pytest', f'tests/{suite}'], check=True)
if __name__ == '__main__':
    run_tests()
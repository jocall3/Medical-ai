import os
def trigger_docs():
    print("Triggering automated documentation engine for medical compliance...")
    # Logic to invoke Sphinx or MkDocs with regulatory templates
    os.system("make docs-generate")
if __name__ == '__main__':
    trigger_docs()
import os, glob, re

projects_dir = '/Users/narayan/Documents/GitHub/portfolio/src/content/projects'
files = glob.glob(os.path.join(projects_dir, '*.mdx'))

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # 1. Extract outcome section using regex
    # Match from <ProjectSection .* id="outcome" to the end of the file
    match = re.search(r'(<ProjectSection[^>]*id=[\'\"]outcome[\'\"][^>]*>.*)', content, flags=re.DOTALL)
    if not match:
        continue
    outcome_content = match.group(1)
    
    # Remove outcome from the bottom
    content = content.replace(outcome_content, '')
    
    # 2. Extract sections array from frontmatter
    sections_block_match = re.search(r'(sections:\s*\n(?:\s*-.*?\n)+)', content)
    target_id = None
    if sections_block_match:
        sections_block = sections_block_match.group(1)
        
        # Find the first id defined.
        ids = re.findall(r'-\s*(?:\{\s*)?id:\s*[\'\"](.*?)[\'\"]', sections_block)
        
        for idx in ids:
            if idx != 'outcome':
                target_id = idx
                break
                
        # To update the YAML, extract the 'outcome' YAML entry.
        yaml_outcome_match = re.search(r'(\s*-\s*(?:\{\s*)?id:\s*[\'\"]outcome[\'\"][^\n]*\n(?:(?!\s*-)\s+.*?\n)*)', content)
        if yaml_outcome_match:
            yaml_outcome = yaml_outcome_match.group(1)
            # Remove outcome from current position in YAML
            content = content.replace(yaml_outcome, '', 1) 
            
            # Put outcome at the beginning of the sections array
            content = content.replace('sections:\n', 'sections:\n' + yaml_outcome)
            
    if not target_id:
        target_id = 'problem-opportunity' # fallback

    # 3. Insert outcome physically above the target section
    insert_match = re.search(rf'(<ProjectSection[^>]*id=[\'\"]{target_id}[\'\"][^>]*>)', content)
    if insert_match:
        target_str = insert_match.group(1)
        content = content.replace(target_str, outcome_content + '\n\n' + target_str)
        
        with open(file, 'w') as f:
            f.write(content)
        print(f'Processed {os.path.basename(file)} successfully.')
    else:
        print(f'Warning: Could not find target section {target_id} right above in {os.path.basename(file)}. We will insert it right before the first ProjectSection.')
        first_section_match = re.search(r'(<ProjectSection[^>]*>)', content)
        if first_section_match:
             target_str = first_section_match.group(1)
             content = content.replace(target_str, outcome_content + '\n\n' + target_str)
             with open(file, 'w') as f:
                 f.write(content)
             print(f'Processed {os.path.basename(file)} using fallback.')

import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))
css=open('p1.css').read().replace('/*DARK*/',open('dark.css').read())
html=('<title>IM CRM Redesign</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&display=swap">\n'
 '<style>\n'+css+'\n</style>\n'+open('shell.html').read()+'\n<script>\n(() => {\n'+open('p2.js').read()+'\n'+open('p3.js').read()+'\n'+open('p4.js').read()+'\n})();\n</script>\n')
open('../im-crm-redesign.html','w').write(html)
print(len(html))

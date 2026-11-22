"""Run repository story tables against an already installed local package.
No API keys or session data are written into Git-tracked files.
"""
from pathlib import Path
import json,os,subprocess,sys,time
import yaml
repo=Path(sys.argv[1]).resolve(); tags=sys.argv[2] if len(sys.argv)>2 else 'not @manual'
alkiln=Path(os.environ.get('ALKILN_PATH',str(Path.home()/'ALKiln')))
package=repo.name.removeprefix('docassemble-');sources=repo/'docassemble'/package/'data/sources'
artifacts=repo/'.alkiln-artifacts'/time.strftime('%Y%m%d-%H%M%S');artifacts.mkdir(parents=True)
settings=yaml.safe_load((Path.home()/'.docassemblecli').read_text())
server=next(item for item in settings if item['name']=='localhost')
env=os.environ.copy();env.update(ALKILN_PATH=str(alkiln),SERVER_URL=server['apiurl'],DOCASSEMBLE_DEVELOPER_API_KEY=server['apikey'],REPO_URL='https://github.com/SuffolkLITLab/'+repo.name,BRANCH_NAME='publication/readiness-sprint',TZ='America/New_York')
(repo/'runtime_config.json').write_text(json.dumps({'da_install_method':'server','da_repo_folder_name':package,'artifacts_path':str(artifacts)}))
# Use ALKiln's setters to preserve its runtime-config key contract.
setup="const s=require(process.argv[1]);s.save_install_method('server');s.save_repo_folder_name(process.argv[2]);s.save_artifacts_path_name(process.argv[3]);"
subprocess.run(['node','-e',setup,str(alkiln/'lib/utils/session_vars.js'),package,str(artifacts)],cwd=repo,env=env,check=True)
helper=artifacts/'bootstrap.cjs';helper.write_text('const s=require('+json.dumps(str(alkiln/'lib/utils/session_vars.js'))+');s.set_sources_paths(['+json.dumps(str(sources))+']);\n')
cmd=['node',str(alkiln/'node_modules/@cucumber/cucumber/bin/cucumber.js'),'--require',str(helper),'--require',str(alkiln/'lib/index.js'),'--tags',tags,'--format','progress','--format','json:'+str(artifacts/'cucumber.json'),'--format','summary:'+str(artifacts/'summary.txt'),str(sources/'*.feature')]
if (repo/'tests/steps.cjs').exists():cmd[2:2]=['--require',str(repo/'tests/steps.cjs')]
with (artifacts/'console.txt').open('w') as output:
 result=subprocess.run(cmd,cwd=repo,env=env,stdout=output,stderr=subprocess.STDOUT)
print('Artifacts:',artifacts)
summary=artifacts/'summary.txt'
print(summary.read_text()[-12000:] if summary.exists() else (artifacts/'console.txt').read_text()[-5000:])
sys.exit(result.returncode)

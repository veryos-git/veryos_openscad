# Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
"""Inspect every exact rendered OFF and save a publication audit."""
import json, sys
from pathlib import Path
import trimesh
cfg=json.loads(Path(sys.argv[1]).read_text()); root=Path(cfg['root']); cache=Path(cfg['cache'])
report=[]
for p in cfg['projects']:
    for i,v in enumerate(p['variants']):
        path=cache/p['id']/f'{i+1}.off'
        row={'project':p['id'],'variant':v['name']}
        if not path.exists():row['error']='missing mesh'
        else:
            mesh=trimesh.load(path,force='mesh',process=False)
            row.update(triangles=len(mesh.faces),watertight=bool(mesh.is_watertight),winding_consistent=bool(mesh.is_winding_consistent),volume_mm3=float(mesh.volume),bounds_mm=mesh.bounds.round(5).tolist(),components=len(mesh.split(only_watertight=False)))
            if mesh.is_empty or not mesh.is_watertight or not mesh.is_winding_consistent or mesh.volume<=0:row['error']='mesh quality check failed'
        report.append(row)
        if 'error' in row:print(json.dumps(row),flush=True)
(root/'publishing/mesh-audit.json').write_text(json.dumps(report,indent=2)+'\n')
failed=[r for r in report if 'error' in r]
print(json.dumps({'meshes':len(report),'passed':len(report)-len(failed),'failed':len(failed)}))
sys.exit(bool(failed))

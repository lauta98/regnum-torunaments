# CLAUDE.md

Antes de tocar cualquier archivo de UI, leé `docs/design.md`. Sus reglas mandan sobre
tus defaults.

## Git
Tenés autorización para hacer `git commit` y `git push` a `origin/main`
sin pedir confirmación cada vez, incluyendo trabajo multi-commit. Esto NO
incluye `vercel --prod` ni ningún despliegue a producción — eso lo corre
el usuario en su propia terminal, siempre. Tampoco incluye operaciones
destructivas (force-push, reset --hard, borrar ramas) ni tocar
configuración de Vercel — para eso, seguí pidiendo confirmación como
hasta ahora.

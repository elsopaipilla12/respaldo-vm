"""Genera credenciales aleatorias para RabbitMQ y las crea como Secrets en K8s.

No imprime credenciales ni crea archivos con contraseñas.
Solo ejecutar UNA VEZ para un broker nuevo; re-ejecutar no rota credenciales.
"""
import json
import secrets
import subprocess
import sys

namespace = 'grupo-reacciones'
username = 'reactions'
password = secrets.token_hex(24)
url = f'amqp://{username}:{password}@rabbitmq-reacciones.{namespace}.svc.cluster.local:5672/'

objects = [
    {
        'apiVersion': 'v1', 'kind': 'Secret',
        'metadata': {'name': 'rabbitmq-reacciones-auth', 'namespace': namespace},
        'type': 'Opaque',
        'stringData': {'username': username, 'password': password},
    },
    {
        'apiVersion': 'v1', 'kind': 'Secret',
        'metadata': {'name': 'reaction-broker-url', 'namespace': namespace},
        'type': 'Opaque',
        'stringData': {'EVENT_BROKER_URL': url},
    },
]
manifest = '\n---\n'.join(json.dumps(obj) for obj in objects) + '\n'
result = subprocess.run(['kubectl', 'create', '-f', '-'], input=manifest, text=True, capture_output=True)
if result.stdout:
    print(result.stdout, end='')
if result.returncode:
    print('La creación no se completó. NO ejecutes nuevamente sin revisar los Secrets existentes.', file=sys.stderr)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    sys.exit(result.returncode)
print('Credenciales creadas. No las copies a Git ni las muestres por pantalla.')

#!/bin/bash

ALB_URL="http://elb.amazonaws.com/"

PARALLEL_REQUESTS=20

generate_requests() {
  while true; do
    curl -s "$ALB_URL" > /dev/null
  done
}

echo "Gerando carga contra $ALB_URL com $PARALLEL_REQUESTS processos paralelos..."

for i in $(seq 1 $PARALLEL_REQUESTS); do
  generate_requests &
done

echo "Pressione Ctrl+C para parar."
wait

#/bin/sh

podman run --rm --workdir /test/ -it -v .:/test/ devimage ng serve
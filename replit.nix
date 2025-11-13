{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.python3
    pkgs.pkg-config
    pkgs.libpng
    pkgs.libjpeg
    pkgs.libuuid
    pkgs.openssl
    pkgs.zlib
    pkgs.python3Packages.pip
  ];
}

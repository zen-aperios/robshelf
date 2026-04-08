from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


def main() -> None:
    address = ("0.0.0.0", 8030)
    with ThreadingHTTPServer(address, SimpleHTTPRequestHandler) as server:
        print("Serving bookshelf scene at http://127.0.0.1:8030")
        server.serve_forever()


if __name__ == "__main__":
    main()

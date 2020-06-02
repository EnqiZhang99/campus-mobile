import 'dart:async';
import 'package:flutter/material.dart';  
import 'package:webview_flutter/webview_flutter.dart';  
  
class WebViewContainer extends StatefulWidget {  
  final url;  
  
  WebViewContainer(this.url);  
  
  @override  
  createState() => _WebViewContainerState(this.url);  
}  
  
class _WebViewContainerState extends State<WebViewContainer> {  
  final Completer<WebViewController> _controller = Completer<WebViewController>();
  var _url;
  _WebViewContainerState(this._url);  
  
  @override  
  Widget build(BuildContext context) {  
    return Scaffold(  
        appBar: AppBar(
          title: const Text('Webreg'),
        ),  
        body: Builder(builder: (BuildContext context) {
        return WebView(
          initialUrl: _url,
          javascriptMode: JavascriptMode.unrestricted,
          onWebViewCreated: (WebViewController webViewController) {
            _controller.complete(webViewController);
          },
        );
      }),
      // floatingActionButton: FutureBuilder<WebViewController>(
      //   future: _controller.future,
      //   builder: (BuildContext context, 
      //     AsyncSnapshot<WebViewController> controller) {
      //       if (controller.hasData) {
      //         return FloatingActionButton(
      //           child: Icon(Icons.arrow_back),
      //           onPressed: () {
      //             controller.data.goBack();
      //           });
      //       }

      //       return Container();
      //     }
      //   ),
    );
  }  
} 
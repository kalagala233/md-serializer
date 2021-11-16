import * as vscode from 'vscode';
import { parser, clearSerial } from './parser';

export function activate(context: vscode.ExtensionContext) {
	// const workbenchConfig = vscode.workspace.getConfiguration('workbench');
	// const a = vscode.workspace.getConfiguration('eslint');
	// console.log(a.get('validate')); // 通过这种方式就可以拿到我的配置 …… 


	vscode.commands.registerTextEditorCommand('serialer.parse', (textEditor => {
		let text = textEditor.document.getText();

		text = parser(text);

		var firstLine = textEditor.document.lineAt(0);
		var lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);
		var textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);

		textEditor.edit(editBuilder => {
			editBuilder.replace(textRange, text);
		});

	}));

	vscode.commands.registerTextEditorCommand('serialer.clear', (textEditor => {
		let text = textEditor.document.getText();

		text = clearSerial(text);

		var firstLine = textEditor.document.lineAt(0);
		var lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);
		var textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);

		textEditor.edit(editBuilder => {
			editBuilder.replace(textRange, text);
		});
	}));
}

export function deactivate() {}
